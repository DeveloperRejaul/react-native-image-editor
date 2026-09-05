/**
 * Vector stickers. Each `path` is an SVG path string drawn in a 200x200 design
 * box centred on the origin (coords roughly -100..100), so a sticker's design
 * half-size is 100 before the user scales it.
 */
export interface StickerShape {
  id: string;
  label: string;
  path: string;
  /** Draw as a filled shape (true) or a stroked outline (false). */
  fill: boolean;
}

export const STICKER_HALF = 100;

export const STICKERS: StickerShape[] = [
  {
    id: 'star',
    label: 'Star',
    fill: true,
    path: 'M0 -95 L27 -30 L96 -30 L40 12 L60 80 L0 40 L-60 80 L-40 12 L-96 -30 L-27 -30 Z',
  },
  {
    id: 'heart',
    label: 'Heart',
    fill: true,
    path: 'M0 80 C-70 20 -95 -25 -55 -65 C-25 -92 0 -70 0 -40 C0 -70 25 -92 55 -65 C95 -25 70 20 0 80 Z',
  },
  {
    id: 'bolt',
    label: 'Bolt',
    fill: true,
    path: 'M15 -95 L-45 20 L-5 20 L-20 95 L50 -20 L5 -20 Z',
  },
  {
    id: 'circle',
    label: 'Ring',
    fill: false,
    path: 'M0 -85 A85 85 0 1 0 0 85 A85 85 0 1 0 0 -85 Z',
  },
  {
    id: 'arrow',
    label: 'Arrow',
    fill: true,
    path: 'M-90 -22 L35 -22 L35 -55 L95 0 L35 55 L35 22 L-90 22 Z',
  },
  {
    id: 'burst',
    label: 'Burst',
    fill: true,
    path: 'M0 -95 L18 -40 L70 -70 L44 -16 L98 0 L44 16 L70 70 L18 40 L0 95 L-18 40 L-70 70 L-44 16 L-98 0 L-44 -16 L-70 -70 L-18 -40 Z',
  },
];

export function stickerPath(id: string | undefined): StickerShape | undefined {
  return id ? STICKERS.find(s => s.id === id) : undefined;
}

export const STICKER_COLORS = [
  '#FFFFFF',
  '#FF6B6B',
  '#FFD93D',
  '#4C8DFF',
  '#3DDC97',
  '#1A1C22',
];
