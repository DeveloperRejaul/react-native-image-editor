import type { Frame } from '../features/editor/types/editor.types';
import { NO_FRAME_ID } from '../features/editor/types/editor.types';

/**
 * Bundled frames. Assets are transparent 1400x1400 PNGs drawn to fill the canvas
 * while the user image moves beneath them. Remote / premium frames will slot in
 * here later with `imageUrl` / `category` — the selector and renderer already
 * treat `source` and `imageUrl` interchangeably.
 */
export const FRAMES: Frame[] = [
  { id: NO_FRAME_ID, name: 'None' },
  { id: 'frame-001', name: 'Polaroid', source: require('../assets/frames/frame-001.png'), category: 'classic' },
  { id: 'frame-002', name: 'Film', source: require('../assets/frames/frame-002.png'), category: 'classic' },
  { id: 'frame-003', name: 'Gold', source: require('../assets/frames/frame-003.png'), category: 'ornate' },
  { id: 'frame-004', name: 'Soft', source: require('../assets/frames/frame-004.png'), category: 'classic' },
  { id: 'frame-005', name: 'Neon', source: require('../assets/frames/frame-005.png'), category: 'bold' },
];

export const DEFAULT_FRAME_ID = NO_FRAME_ID;
