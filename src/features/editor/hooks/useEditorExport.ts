import { useCallback, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { ImageFormat, type CanvasRef } from '@shopify/react-native-skia';
import type { ExportResult, Rect } from '../types/editor.types';

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

interface RunExportArgs {
  canvasRef: React.RefObject<CanvasRef | null>;
  /** Region of the canvas to capture (the visible canvas rect). */
  captureRect: Rect;
  /** 'png' keeps the frame's transparency; 'jpeg' is smaller. */
  format?: 'png' | 'jpeg';
  quality?: number;
}

interface UseEditorExportResult {
  save: (args: RunExportArgs) => Promise<ExportResult>;
  share: (args: RunExportArgs) => Promise<void>;
  exporting: boolean;
}

const TMP_DIR = ReactNativeBlobUtil.fs.dirs.CacheDir;

async function ensureAndroidWritePermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version > 28) return;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Save to Photos',
      message: 'GFL Image Editor needs permission to save the exported image.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new ExportError('Storage permission was denied, so the image was not saved.');
  }
}

/** Snapshot the canvas region and write it to a temp file. Never resolves silently. */
async function renderToTempFile({
  canvasRef,
  captureRect,
  format = 'png',
  quality = 100,
}: RunExportArgs): Promise<ExportResult> {
  const canvas = canvasRef.current;
  if (!canvas) throw new ExportError('The editor canvas is not ready yet.');

  const snapshot = await canvas.makeImageSnapshotAsync({
    x: captureRect.x,
    y: captureRect.y,
    width: captureRect.width,
    height: captureRect.height,
  });
  if (!snapshot) throw new ExportError('Could not capture the canvas.');

  const fmt = format === 'jpeg' ? ImageFormat.JPEG : ImageFormat.PNG;
  const base64 = snapshot.encodeToBase64(fmt, quality);
  if (!base64) throw new ExportError('Failed to encode the image.');

  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const path = `${TMP_DIR}/gfl-${Date.now()}.${ext}`;
  try {
    await ReactNativeBlobUtil.fs.writeFile(path, base64, 'base64');
  } catch (e) {
    throw new ExportError(
      `Could not write the temporary file${
        e instanceof Error && /space/i.test(e.message)
          ? ' — the device may be out of storage.'
          : '.'
      }`,
    );
  }

  return {
    uri: `file://${path}`,
    format,
    width: snapshot.width(),
    height: snapshot.height(),
  };
}

/**
 * Export the current composition (image + transform + frame + overlays). `save`
 * writes it to the device gallery; `share` hands it to the OS share sheet.
 * Overlapping exports are blocked.
 */
export function useEditorExport(): UseEditorExportResult {
  const [exporting, setExporting] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T> => {
      if (inFlight.current) throw new ExportError('An export is already in progress.');
      inFlight.current = true;
      setExporting(true);
      try {
        return await work();
      } finally {
        inFlight.current = false;
        setExporting(false);
      }
    },
    [],
  );

  const save = useCallback(
    (args: RunExportArgs) =>
      run(async () => {
        await ensureAndroidWritePermission();
        const result = await renderToTempFile(args);
        try {
          await CameraRoll.saveAsset(result.uri, { type: 'photo', album: 'GFL Image Editor' });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/denied|permission/i.test(msg)) {
            throw new ExportError('Photo library permission was denied, so the image was not saved.');
          }
          throw new ExportError(`Saving to Photos failed: ${msg}`);
        } finally {
          ReactNativeBlobUtil.fs.unlink(result.uri.replace('file://', '')).catch(() => undefined);
        }
        return result;
      }),
    [run],
  );

  const share = useCallback(
    (args: RunExportArgs) =>
      run(async () => {
        const result = await renderToTempFile(args);
        try {
          await Share.open({
            url: result.uri,
            type: args.format === 'jpeg' ? 'image/jpeg' : 'image/png',
            failOnCancel: false,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/cancel/i.test(msg)) return;
          throw new ExportError(`Sharing failed: ${msg}`);
        } finally {
          // Give the share sheet a moment to read the file before cleanup.
          setTimeout(
            () => ReactNativeBlobUtil.fs.unlink(result.uri.replace('file://', '')).catch(() => undefined),
            15000,
          );
        }
      }),
    [run],
  );

  return { save, share, exporting };
}
