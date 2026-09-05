import type { Rect, Size } from '../types/editor.types';
import { CANVAS_ASPECT } from '../../../constants/dimensions';

/**
 * Largest rect of the given aspect ratio that fits inside `bounds`, centred.
 * Used to size the editor canvas within the available screen area.
 */
export function fitAspect(bounds: Size, aspect = CANVAS_ASPECT): Rect {
  let width = bounds.width;
  let height = width / aspect;
  if (height > bounds.height) {
    height = bounds.height;
    width = height * aspect;
  }
  return {
    x: (bounds.width - width) / 2,
    y: (bounds.height - height) / 2,
    width,
    height,
  };
}

/**
 * "contain" fit: scale `content` to sit fully inside `container` with its aspect
 * ratio preserved (never stretched), then centre it.
 */
export function containRect(content: Size, container: Size): Rect {
  if (content.width <= 0 || content.height <= 0) {
    return { x: 0, y: 0, width: container.width, height: container.height };
  }
  const scale = Math.min(
    container.width / content.width,
    container.height / content.height,
  );
  const width = content.width * scale;
  const height = content.height * scale;
  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

/**
 * "cover" scale factor: the multiplier that makes `content` fully cover
 * `container` (used to offer a sensible starting zoom).
 */
export function coverScale(content: Size, container: Size): number {
  if (content.width <= 0 || content.height <= 0) return 1;
  return Math.max(
    container.width / content.width,
    container.height / content.height,
  );
}

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}
