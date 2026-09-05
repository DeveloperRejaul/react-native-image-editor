import { useCallback, useRef, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { ImageLoadError, isSupportedMimeType, measureImage } from '../utils/image';

/**
 * Pick a single image from the device library and return its URI (or null on
 * cancel). Used for imported stickers; failures surface as a readable `error`.
 */
export function useImageImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const pick = useCallback(async (): Promise<string | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setImporting(true);
    setError(null);
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 1,
        includeExtra: true,
      });
      if (res.didCancel) return null;
      if (res.errorCode) {
        throw new ImageLoadError(
          res.errorMessage ??
            (res.errorCode === 'permission'
              ? 'Photo library permission was denied.'
              : 'The picker failed to open.'),
        );
      }
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new ImageLoadError('No image was selected.');
      if (!isSupportedMimeType(asset.type)) {
        throw new ImageLoadError(`Unsupported image format${asset.type ? ` (${asset.type})` : ''}.`);
      }
      if (!asset.width || !asset.height) await measureImage(asset.uri);
      return asset.uri;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong importing the image.');
      return null;
    } finally {
      inFlight.current = false;
      setImporting(false);
    }
  }, []);

  return { pick, importing, error, clearError };
}
