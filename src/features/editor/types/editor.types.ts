/**
 * Editor domain types. These describe the editor's data model independently of
 * how it is rendered, so future layers (text, stickers, drawing) can be added
 * without reworking the existing ones.
 */

/** A picked image plus the intrinsic pixel size we measured for it. */
export interface EditorImage {
  /** Local URI usable by Skia / <Image> (e.g. file://...). */
  uri: string;
  /** Intrinsic width in pixels. */
  width: number;
  /** Intrinsic height in pixels. */
  height: number;
  /** MIME type when the picker reported one. */
  mimeType?: string;
  /** Original file name when available. */
  fileName?: string;
}

/**
 * The single source of truth for how the user image sits on the canvas.
 * Applied around the image's centre: scale, then rotate, then translate.
 */
export interface ImageTransform {
  scale: number;
  translateX: number;
  translateY: number;
  /** Radians. */
  rotation: number;
}

export const IDENTITY_TRANSFORM: ImageTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  rotation: 0,
};

/** Axis-aligned rectangle in canvas coordinates. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * A frame overlay. `source` is a bundled asset module id (require('...png')) for
 * the MVP; `imageUrl` / `category` are reserved for remote and premium frames so
 * the selector and renderer won't need to change when those arrive.
 */
export interface Frame {
  id: string;
  name: string;
  source?: number;
  imageUrl?: string;
  category?: string;
}

/** Sentinel selector entry meaning "no frame". */
export const NO_FRAME_ID = 'none';

/* ---- Editing tools ---------------------------------------------------------- */

export type ToolId = 'none' | 'size' | 'frame' | 'text' | 'sticker' | 'filter' | 'draw';

export type FilterId = 'none' | 'mono' | 'noir' | 'vivid' | 'warm' | 'cool' | 'fade';

/** Shared placement for a movable overlay item (centre-anchored, canvas coords). */
export interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  /** Extra horizontal-only multiplier (side width handles). Defaults to 1. */
  scaleX: number;
  rotation: number;
}

interface OverlayBase extends OverlayTransform {
  id: string;
  /** Half-size of the item's design box, for hit-testing and selection UI. */
  halfWidth: number;
  halfHeight: number;
  /** Layer flags. */
  hidden?: boolean;
  locked?: boolean;
}

export interface TextOverlay extends OverlayBase {
  kind: 'text';
  text: string;
  color: string;
  fontSize: number;
  /** Font family id from constants/fonts.ts. */
  familyId: string;
  /** Weight + slant id from constants/fonts.ts. */
  styleId: string;
}

export interface StickerOverlay extends OverlayBase {
  kind: 'sticker';
  /** Built-in vector shape id from the sticker palette (when `imageUrl` unset). */
  shape?: string;
  /** Imported image sticker URI (takes precedence over `shape`). */
  imageUrl?: string;
  color: string;
}

export type Overlay = TextOverlay | StickerOverlay;

/** One finished freehand stroke. `path` is an SVG path string in canvas coords. */
export interface DrawStroke {
  id: string;
  path: string;
  color: string;
  width: number;
  /** Eraser stroke: clears earlier strokes within the drawing layer. */
  erase?: boolean;
}

export type ExportFormat = 'png' | 'jpeg';

export interface ExportResult {
  uri: string;
  format: ExportFormat;
  width: number;
  height: number;
}
