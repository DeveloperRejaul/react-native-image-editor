import { useCallback, useMemo, useState } from 'react';
import type {
  DrawStroke,
  FilterId,
  Overlay,
  OverlayTransform,
  StickerOverlay,
  TextOverlay,
} from '../types/editor.types';
import { STICKER_HALF } from '../constants/stickers';

let seq = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;

export interface EditorLayers {
  overlays: Overlay[];
  strokes: DrawStroke[];
  filter: FilterId;
  selectedId: string | null;
  selectedOverlay: Overlay | null;

  setFilter: (id: FilterId) => void;
  addText: (
    input: {
      text: string;
      color: string;
      fontSize: number;
      halfWidth: number;
      familyId: string;
      styleId: string;
    },
    at: { x: number; y: number },
  ) => string;
  updateText: (
    id: string,
    patch: Partial<
      Pick<TextOverlay, 'text' | 'color' | 'fontSize' | 'halfWidth' | 'familyId' | 'styleId'>
    >,
  ) => void;
  addSticker: (shape: string, color: string, at: { x: number; y: number }) => string;
  addStickerImage: (imageUrl: string, at: { x: number; y: number }) => string;
  /** Merge fields into the selected overlay (colour, font, …). */
  updateSelected: (patch: Partial<TextOverlay> & Partial<StickerOverlay>) => void;
  moveSelected: (patch: Partial<OverlayTransform>) => void;
  nudgeSelected: (d: { dx?: number; dy?: number; dScale?: number; dRotation?: number }) => void;
  select: (id: string | null) => void;
  removeSelected: () => void;
  toggleOverlayHidden: (id: string) => void;
  toggleOverlayLocked: (id: string) => void;
  /** Move an overlay within the z-order (array index). */
  reorderOverlay: (from: number, to: number) => void;

  /** Append a finished freehand stroke (built on the UI thread). */
  pushStroke: (stroke: DrawStroke) => void;
  undoStroke: () => void;
  clearStrokes: () => void;

  /** Replace overlays / strokes / filter wholesale (used by undo-redo). */
  restore: (doc: { overlays: Overlay[]; strokes: DrawStroke[]; filter: FilterId }) => void;

  hasEdits: boolean;
}

const MIN_OVERLAY_SCALE = 0.2;
const MAX_OVERLAY_SCALE = 6;

export function useEditorLayers(): EditorLayers {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [filter, setFilter] = useState<FilterId>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedOverlay = useMemo(
    () => overlays.find(o => o.id === selectedId) ?? null,
    [overlays, selectedId],
  );

  const addText: EditorLayers['addText'] = useCallback((input, at) => {
    const id = nextId('text');
    const overlay: TextOverlay = {
      kind: 'text',
      id,
      x: at.x,
      y: at.y,
      scale: 1,
      scaleX: 1,
      rotation: 0,
      halfWidth: input.halfWidth,
      halfHeight: input.fontSize * 0.7,
      text: input.text,
      color: input.color,
      fontSize: input.fontSize,
      familyId: input.familyId,
      styleId: input.styleId,
    };
    setOverlays(prev => [...prev, overlay]);
    setSelectedId(id);
    return id;
  }, []);

  const updateText: EditorLayers['updateText'] = useCallback((id, patch) => {
    setOverlays(prev =>
      prev.map(o => {
        if (o.id !== id || o.kind !== 'text') return o;
        const next = { ...o, ...patch };
        return { ...next, halfHeight: next.fontSize * 0.7 };
      }),
    );
  }, []);

  const updateSelected: EditorLayers['updateSelected'] = useCallback(
    patch => {
      if (!selectedId) return;
      setOverlays(prev =>
        prev.map(o => (o.id === selectedId ? ({ ...o, ...patch } as Overlay) : o)),
      );
    },
    [selectedId],
  );

  const addSticker: EditorLayers['addSticker'] = useCallback((shape, color, at) => {
    const id = nextId('stk');
    const overlay: StickerOverlay = {
      kind: 'sticker',
      id,
      x: at.x,
      y: at.y,
      scale: 1,
      scaleX: 1,
      rotation: 0,
      halfWidth: STICKER_HALF,
      halfHeight: STICKER_HALF,
      shape,
      color,
    };
    setOverlays(prev => [...prev, overlay]);
    setSelectedId(id);
    return id;
  }, []);

  const addStickerImage: EditorLayers['addStickerImage'] = useCallback((imageUrl, at) => {
    const id = nextId('stk');
    const overlay: StickerOverlay = {
      kind: 'sticker',
      id,
      x: at.x,
      y: at.y,
      scale: 1,
      scaleX: 1,
      rotation: 0,
      halfWidth: STICKER_HALF,
      halfHeight: STICKER_HALF,
      imageUrl,
      color: '#FFFFFF',
    };
    setOverlays(prev => [...prev, overlay]);
    setSelectedId(id);
    return id;
  }, []);

  const moveSelected: EditorLayers['moveSelected'] = useCallback(
    patch => {
      if (!selectedId) return;
      setOverlays(prev => prev.map(o => (o.id === selectedId ? { ...o, ...patch } : o)));
    },
    [selectedId],
  );

  const nudgeSelected: EditorLayers['nudgeSelected'] = useCallback(
    ({ dx = 0, dy = 0, dScale = 1, dRotation = 0 }) => {
      if (!selectedId) return;
      setOverlays(prev =>
        prev.map(o => {
          if (o.id !== selectedId) return o;
          const scale = Math.min(Math.max(o.scale * dScale, MIN_OVERLAY_SCALE), MAX_OVERLAY_SCALE);
          return { ...o, x: o.x + dx, y: o.y + dy, scale, rotation: o.rotation + dRotation };
        }),
      );
    },
    [selectedId],
  );

  const select: EditorLayers['select'] = useCallback(id => setSelectedId(id), []);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    setOverlays(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const toggleOverlayHidden: EditorLayers['toggleOverlayHidden'] = useCallback(id => {
    setOverlays(prev => prev.map(o => (o.id === id ? { ...o, hidden: !o.hidden } : o)));
    setSelectedId(sel => (sel === id ? null : sel));
  }, []);

  const toggleOverlayLocked: EditorLayers['toggleOverlayLocked'] = useCallback(id => {
    setOverlays(prev => prev.map(o => (o.id === id ? { ...o, locked: !o.locked } : o)));
    setSelectedId(sel => (sel === id ? null : sel));
  }, []);

  const reorderOverlay: EditorLayers['reorderOverlay'] = useCallback((from, to) => {
    setOverlays(prev => {
      if (from === to || from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const pushStroke: EditorLayers['pushStroke'] = useCallback(
    s => setStrokes(prev => (s.path.includes(' L ') ? [...prev, s] : prev)),
    [],
  );
  const undoStroke = useCallback(() => setStrokes(s => s.slice(0, -1)), []);
  const clearStrokes = useCallback(() => setStrokes([]), []);

  const restore: EditorLayers['restore'] = useCallback(doc => {
    setOverlays(doc.overlays);
    setStrokes(doc.strokes);
    setFilter(doc.filter);
    setSelectedId(prev => (doc.overlays.some(o => o.id === prev) ? prev : null));
  }, []);

  const hasEdits =
    filter !== 'none' || overlays.length > 0 || strokes.length > 0;

  return {
    overlays,
    strokes,
    filter,
    selectedId,
    selectedOverlay,
    setFilter,
    addText,
    updateText,
    addSticker,
    addStickerImage,
    updateSelected,
    moveSelected,
    nudgeSelected,
    select,
    removeSelected,
    toggleOverlayHidden,
    toggleOverlayLocked,
    reorderOverlay,
    pushStroke,
    undoStroke,
    clearStrokes,
    restore,
    hasEdits,
  };
}
