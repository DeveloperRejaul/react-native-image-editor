/**
 * Workspace (canvas) aspect-ratio presets. `ratio` is width / height. The
 * editor fits the largest rect of this ratio into the available area, and the
 * export snapshot is taken at exactly the canvas rect — so changing the ratio
 * changes the saved image's proportions.
 */
export interface WorkspacePreset {
  id: string;
  label: string;
  ratio: number;
}

export const WORKSPACE_PRESETS: WorkspacePreset[] = [
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'post', label: '3:4', ratio: 3 / 4 },
  { id: 'story', label: '9:16', ratio: 9 / 16 },
  { id: 'landscape', label: '3:2', ratio: 3 / 2 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
];

export const DEFAULT_WORKSPACE = WORKSPACE_PRESETS[0]; // 1:1

/** Bounds for the fine +/- ratio nudge. */
export const MIN_RATIO = 0.4;
export const MAX_RATIO = 2.6;
export const RATIO_STEP = 1.06;

export function nearestPresetId(ratio: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const p of WORKSPACE_PRESETS) {
    const d = Math.abs(p.ratio - ratio);
    if (!best || d < best.d) best = { id: p.id, d };
  }
  return best && best.d < 0.02 ? best.id : null;
}

export function formatRatio(ratio: number): string {
  return ratio >= 1 ? `${ratio.toFixed(2)} : 1` : `1 : ${(1 / ratio).toFixed(2)}`;
}
