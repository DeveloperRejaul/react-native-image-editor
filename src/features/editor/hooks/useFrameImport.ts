import { useCallback, useRef, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import type { Frame } from '../types/editor.types';
import { ImageLoadError, isSupportedMimeType, measureImage } from '../utils/image';

interface UseFrameImportResult {
  importFrame: () => Promise<Frame | null>;
  importing: boolean;
  error: string | null;
  clearError: () => void;
}

let customFrameCounter = 0;

/**
 * Lets the user pick an image from the device to use as a frame overlay. A
 * transparent PNG is expected (opaque images will simply cover the photo); we
 * don't hard-block other formats. Returns a Frame with `imageUrl` set.
 */
export function useFrameImport(): UseFrameImportResult {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const importFrame = useCallback(async (): Promise<Frame | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setImporting(true);
    setError(null);
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 1,
        includeExtra: true,
        restrictMimeTypes: ['image/png', 'image/webp'],
      });

      if (response.didCancel) return null;
      if (response.errorCode) {
        throw new ImageLoadError(
          response.errorMessage ??
            (response.errorCode === 'permission'
              ? 'Photo library permission was denied.'
              : 'The picker failed to open.'),
        );
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) {
        throw new ImageLoadError('No frame image was selected.');
      }
      if (!isSupportedMimeType(asset.type)) {
        throw new ImageLoadError(`Unsupported frame format${asset.type ? ` (${asset.type})` : ''}.`);
      }
      // Confirm it decodes before we hand it to the renderer.
      if (!asset.width || !asset.height) {
        await measureImage(asset.uri);
      }

      customFrameCounter += 1;
      return {
        id: `custom-${Date.now()}-${customFrameCounter}`,
        name: asset.fileName?.replace(/\.[^.]+$/, '') || `Custom ${customFrameCounter}`,
        imageUrl: asset.uri,
        category: 'custom',
      };
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong importing the frame.',
      );
      return null;
    } finally {
      inFlight.current = false;
      setImporting(false);
    }
  }, []);

  return { importFrame, importing, error, clearError };
}
