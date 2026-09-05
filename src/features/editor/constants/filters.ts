import type { FilterId } from '../types/editor.types';

/**
 * 4x5 colour matrices for Skia's <ColorMatrix>. Row-major RGBA; the 5th column
 * is a constant offset (0-1 scale). `null` means "draw the image untouched".
 */
export interface FilterPreset {
  id: FilterId;
  label: string;
  matrix: number[] | null;
}

const IDENTITY = null;

// Rec. 601 luma weights, reused by the grayscale-based presets.
const LR = 0.299;
const LG = 0.587;
const LB = 0.114;

const MONO = [
  LR, LG, LB, 0, 0,
  LR, LG, LB, 0, 0,
  LR, LG, LB, 0, 0,
  0, 0, 0, 1, 0,
];

// Grayscale, then push contrast (c = 1.35) around mid-grey.
const NOIR_C = 1.35;
const NOIR_O = (1 - NOIR_C) * 0.5;
const NOIR = [
  LR * NOIR_C, LG * NOIR_C, LB * NOIR_C, 0, NOIR_O,
  LR * NOIR_C, LG * NOIR_C, LB * NOIR_C, 0, NOIR_O,
  LR * NOIR_C, LG * NOIR_C, LB * NOIR_C, 0, NOIR_O,
  0, 0, 0, 1, 0,
];

// Saturation boost (s = 1.5): identity blended away from the luma axis.
const s = 1.5;
const VIVID = [
  LR * (1 - s) + s, LG * (1 - s), LB * (1 - s), 0, 0,
  LR * (1 - s), LG * (1 - s) + s, LB * (1 - s), 0, 0,
  LR * (1 - s), LG * (1 - s), LB * (1 - s) + s, 0, 0,
  0, 0, 0, 1, 0,
];

const WARM = [
  1.08, 0, 0, 0, 0.02,
  0, 1.02, 0, 0, 0.01,
  0, 0, 0.9, 0, 0,
  0, 0, 0, 1, 0,
];

const COOL = [
  0.9, 0, 0, 0, 0,
  0, 1.0, 0, 0, 0,
  0, 0, 1.1, 0, 0.03,
  0, 0, 0, 1, 0,
];

// Lower contrast (c = 0.8) with lifted blacks for a faded look.
const FADE_C = 0.8;
const FADE_LIFT = 0.06;
const FADE = [
  FADE_C, 0, 0, 0, FADE_LIFT,
  0, FADE_C, 0, 0, FADE_LIFT,
  0, 0, FADE_C, 0, FADE_LIFT + 0.02,
  0, 0, 0, 1, 0,
];

export const FILTERS: FilterPreset[] = [
  { id: 'none', label: 'Original', matrix: IDENTITY },
  { id: 'mono', label: 'Mono', matrix: MONO },
  { id: 'noir', label: 'Noir', matrix: NOIR },
  { id: 'vivid', label: 'Vivid', matrix: VIVID },
  { id: 'warm', label: 'Warm', matrix: WARM },
  { id: 'cool', label: 'Cool', matrix: COOL },
  { id: 'fade', label: 'Fade', matrix: FADE },
];

export function filterMatrix(id: FilterId): number[] | null {
  return FILTERS.find(f => f.id === id)?.matrix ?? null;
}
