import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Overlay, ToolId } from '../types/editor.types';
import type { EditorLayers } from './useEditorLayers';
import type { EditorGestures } from './useEditorGestures';

interface Params {
  tool: ToolId;
  layers: EditorLayers;
  imageGestures: EditorGestures;
  brush: { color: string; width: number; erase: boolean };
  /** Whether an overlay is currently selected (drives overlay vs image mode). */
  hasSelection: boolean;
  /** Live freehand path string, built on the UI thread while drawing. */
  livePath: SharedValue<string>;
  /** Fired (JS thread) when a freehand stroke starts / ends. */
  onDrawStart: () => void;
  onDrawEnd: () => void;
  /** Double-tapping a text overlay opens its edit modal. */
  onEditText: (id: string) => void;
}

const MIN_STEP = 2.5; // px between recorded freehand points
const MIN_STEP_SQ = MIN_STEP * MIN_STEP;

/** Axis-aligned hit test (ignores rotation — close enough for tap-to-select). */
function pickOverlay(overlays: Overlay[], px: number, py: number): Overlay | null {
  for (let i = overlays.length - 1; i >= 0; i--) {
    const o = overlays[i];
    if (o.hidden || o.locked) continue;
    const hw = o.halfWidth * o.scale * (o.scaleX ?? 1) + 12;
    const hh = o.halfHeight * o.scale + 12;
    if (Math.abs(px - o.x) <= hw && Math.abs(py - o.y) <= hh) return o;
  }
  return null;
}

/**
 * Routes canvas gestures to the right target based on the active tool:
 *  - draw tool  -> build the current freehand stroke on the UI thread
 *  - a selected text/sticker -> move / scale / rotate that overlay
 *  - otherwise  -> pan / pinch / rotate the base image
 * Tapping always hit-tests overlays to change the selection.
 */
export function useCanvasInteraction({
  tool,
  layers,
  imageGestures,
  brush,
  hasSelection,
  livePath,
  onDrawStart,
  onDrawEnd,
  onEditText,
}: Params): ReturnType<typeof Gesture.Race> {
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);

  const finishStroke = useCallback(
    (path: string) => {
      layers.pushStroke({
        id: `stroke-${Date.now().toString(36)}`,
        path,
        color: brush.color,
        width: brush.width,
        erase: brush.erase,
      });
      livePath.value = '';
      onDrawEnd();
    },
    [layers, brush.color, brush.width, brush.erase, livePath, onDrawEnd],
  );

  const tapSelect = (x: number, y: number) => {
    layers.select(pickOverlay(layers.overlays, x, y)?.id ?? null);
  };
  const tapEdit = (x: number, y: number) => {
    const o = pickOverlay(layers.overlays, x, y);
    if (o?.kind === 'text') {
      layers.select(o.id);
      onEditText(o.id);
    }
  };

  return useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(250)
      .onEnd(e => {
        runOnJS(tapSelect)(e.x, e.y);
      });
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(320)
      .onEnd(e => {
        runOnJS(tapEdit)(e.x, e.y);
      });
    const taps = Gesture.Exclusive(doubleTap, tap);

    if (tool === 'draw') {
      const draw = Gesture.Pan()
        .minDistance(0)
        .onBegin(e => {
          lastX.value = e.x;
          lastY.value = e.y;
          livePath.value = `M ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
          runOnJS(onDrawStart)();
        })
        .onUpdate(e => {
          const dx = e.x - lastX.value;
          const dy = e.y - lastY.value;
          if (dx * dx + dy * dy < MIN_STEP_SQ) return;
          lastX.value = e.x;
          lastY.value = e.y;
          livePath.value = `${livePath.value} L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
        })
        .onFinalize(() => {
          runOnJS(finishStroke)(livePath.value);
        });
      return Gesture.Race(draw);
    }

    if (hasSelection) {
      const pan = Gesture.Pan().onChange(e => {
        runOnJS(layers.nudgeSelected)({ dx: e.changeX, dy: e.changeY });
      });
      const pinch = Gesture.Pinch().onChange(e => {
        runOnJS(layers.nudgeSelected)({ dScale: e.scaleChange });
      });
      const rotate = Gesture.Rotation().onChange(e => {
        runOnJS(layers.nudgeSelected)({ dRotation: e.rotationChange });
      });
      return Gesture.Race(taps, Gesture.Simultaneous(pan, pinch, rotate));
    }

    return Gesture.Race(taps, imageGestures.gesture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    hasSelection,
    finishStroke,
    livePath,
    lastX,
    lastY,
    onDrawStart,
    imageGestures.gesture,
    layers.overlays,
  ]);
}
