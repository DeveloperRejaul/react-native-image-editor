import { useCallback, useRef, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import type { EditorImage } from '../../editor/types/editor.types';
import { ImageLoadError, toEditorImage } from '../../editor/utils/image';

interface UseImagePickerResult {
  pick: () => Promise<EditorImage | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Opens the system photo library and returns a validated EditorImage, or null
 * when the user cancels. Every failure path resolves to a readable `error`
 * string rather than throwing at the call site.
 */
export function useImagePicker(): UseImagePickerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const pick = useCallback(async (): Promise<EditorImage | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 1,
        includeExtra: true,
      });

      if (response.didCancel) return null;
      if (response.errorCode) {
        throw new ImageLoadError(
          response.errorMessage ??
            (response.errorCode === 'permission'
              ? 'Photo library permission was denied.'
              : 'The image picker failed to open.'),
        );
      }

      const asset = response.assets?.[0];
      if (!asset) {
        throw new ImageLoadError('No image was selected.');
      }

      return await toEditorImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
      });
    } catch (e) {
      const message =
        e instanceof ImageLoadError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Something went wrong while selecting the image.';
      setError(message);
      return null;
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { pick, loading, error, clearError };
}
