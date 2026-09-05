import { useCallback, useMemo, useState } from 'react';
import { useImage } from '@shopify/react-native-skia';
import type { EditorImage, Rect, Size } from '../types/editor.types';
import { fittedImageRect } from '../utils/transform';

interface UseEditorImageResult {
  /** Decoded image, or null while loading / on failure. */
  skImage: ReturnType<typeof useImage>;
  loading: boolean;
  error: string | null;
  /** "contain" rect for the image inside a given canvas size. */
  getFittedRect: (canvas: Size) => Rect;
}

/**
 * Decodes the picked image once for the Skia canvas and reports load failures.
 * Dimensions come from the already-validated EditorImage — this hook never
 * re-measures.
 */
export function useEditorImage(image: EditorImage): UseEditorImageResult {
  const [error, setError] = useState<string | null>(null);

  const onError = useCallback((e: Error) => {
    setError(e.message || 'The image could not be displayed.');
  }, []);

  const skImage = useImage(image.uri, onError);

  const intrinsic = useMemo<Size>(
    () => ({ width: image.width, height: image.height }),
    [image.width, image.height],
  );

  const getFittedRect = useCallback(
    (canvas: Size) => fittedImageRect(intrinsic, canvas),
    [intrinsic],
  );

  return {
    skImage,
    loading: !skImage && !error,
    error,
    getFittedRect,
  };
}
