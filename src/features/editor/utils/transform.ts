import type { Transforms3d } from '@shopify/react-native-skia';
import type { ImageTransform, Rect, Size } from '../types/editor.types';
import { containRect } from './dimensions';

/**
 * Where the user image sits before any user transform: a "contain" fit inside
 * the canvas, so the whole image is visible and its aspect ratio is preserved.
 */
export function fittedImageRect(image: Size, canvas: Size): Rect {
  return containRect(image, canvas);
}

/**
 * ImageTransform -> Skia transform array, applied around the image centre (pass
 * that centre as the <Image origin=...> prop). Worklet-safe so it can be used
 * inside a Reanimated derived value on the UI thread.
 *
 * Order (matrix mult, left to right): translate, then rotate, then scale — i.e.
 * scale/rotate happen about the origin, translate moves the result.
 */
export function toSkiaTransform(t: ImageTransform): Transforms3d {
  'worklet';
  return [
    { translateX: t.translateX },
    { translateY: t.translateY },
    { rotate: t.rotation },
    { scale: t.scale },
  ];
}

/** Centre point of a rect. */
export function rectCenter(r: Rect): { x: number; y: number } {
  'worklet';
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
