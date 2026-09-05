import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Icon } from '../../../components/Icon';
import type { Overlay, OverlayTransform } from '../types/editor.types';
import { colors } from '../../../theme';

const HANDLE = 30;
const K = HANDLE / 2 + 6; // how far a handle pokes out past the box edge

interface SelectionGizmoProps {
  overlay: Overlay;
  onDelete: () => void;
  onTransform: (patch: Partial<OverlayTransform>) => void;
}

interface DragStart {
  cx: number;
  cy: number;
  rotation: number;
  scale: number;
  scaleX: number;
  angle: number;
  dist: number;
  proj: number;
}

const rot = (x: number, y: number, r: number) => ({
  x: x * Math.cos(r) - y * Math.sin(r),
  y: x * Math.sin(r) + y * Math.cos(r),
});
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Interactive transform box over the selected text / sticker: a thin border
 * with a delete handle (top-left), rotate handle (top-right), scale handle
 * (bottom-right) and width handles on the left / right edges. Dragging the box
 * body itself falls through to the canvas (which moves the item).
 */
export function SelectionGizmo({ overlay, onDelete, onTransform }: SelectionGizmoProps) {
  const sx = overlay.scaleX ?? 1;
  const w = Math.max(24, overlay.halfWidth * overlay.scale * sx * 2);
  const h = Math.max(24, overlay.halfHeight * overlay.scale * 2);
  const drag = useRef<DragStart | null>(null);

  // Screen centre of the box, back-computed from where a handle drag started.
  const centre = (px: number, py: number, localX: number, localY: number) => {
    const off = rot(localX, localY, overlay.rotation);
    return { cx: px - off.x, cy: py - off.y };
  };

  const rotateGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(e => {
      const { cx, cy } = centre(e.absoluteX, e.absoluteY, w / 2 + K, -h / 2 - K);
      drag.current = {
        cx,
        cy,
        rotation: overlay.rotation,
        scale: overlay.scale,
        scaleX: sx,
        angle: Math.atan2(e.absoluteY - cy, e.absoluteX - cx),
        dist: 0,
        proj: 0,
      };
    })
    .onUpdate(e => {
      const d = drag.current;
      if (!d) return;
      const cur = Math.atan2(e.absoluteY - d.cy, e.absoluteX - d.cx);
      onTransform({ rotation: d.rotation + (cur - d.angle) });
    })
    .onFinalize(() => {
      drag.current = null;
    });

  const scaleGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(e => {
      const { cx, cy } = centre(e.absoluteX, e.absoluteY, w / 2 + K, h / 2 + K);
      drag.current = {
        cx,
        cy,
        rotation: overlay.rotation,
        scale: overlay.scale,
        scaleX: sx,
        angle: 0,
        dist: Math.hypot(e.absoluteX - cx, e.absoluteY - cy),
        proj: 0,
      };
    })
    .onUpdate(e => {
      const d = drag.current;
      if (!d || d.dist <= 0) return;
      const cur = Math.hypot(e.absoluteX - d.cx, e.absoluteY - d.cy);
      onTransform({ scale: clamp((d.scale * cur) / d.dist, 0.2, 6) });
    })
    .onFinalize(() => {
      drag.current = null;
    });

  const widthGesture = (side: 1 | -1) =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(e => {
        const { cx, cy } = centre(e.absoluteX, e.absoluteY, side * (w / 2 + K), 0);
        const ux = Math.cos(overlay.rotation);
        const uy = Math.sin(overlay.rotation);
        drag.current = {
          cx,
          cy,
          rotation: overlay.rotation,
          scale: overlay.scale,
          scaleX: sx,
          angle: 0,
          dist: 0,
          proj: (e.absoluteX - cx) * ux + (e.absoluteY - cy) * uy,
        };
      })
      .onUpdate(e => {
        const d = drag.current;
        if (!d || Math.abs(d.proj) < 1) return;
        const ux = Math.cos(d.rotation);
        const uy = Math.sin(d.rotation);
        const cur = (e.absoluteX - d.cx) * ux + (e.absoluteY - d.cy) * uy;
        onTransform({ scaleX: clamp((d.scaleX * cur) / d.proj, 0.3, 4) });
      })
      .onFinalize(() => {
        drag.current = null;
      });

  const deleteGesture = Gesture.Tap().runOnJS(true).onEnd(onDelete);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.box,
        {
          left: overlay.x - w / 2,
          top: overlay.y - h / 2,
          width: w,
          height: h,
          transform: [{ rotate: `${overlay.rotation}rad` }],
        },
      ]}
    >
      <GestureDetector gesture={deleteGesture}>
        <View style={[styles.handle, styles.tl]}>
          <View style={styles.x1} />
          <View style={styles.x2} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={rotateGesture}>
        <View style={[styles.handle, styles.tr]}>
          <Icon name="reset" size={16} color={colors.background} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={scaleGesture}>
        <View style={[styles.handle, styles.br]}>
          <Icon name="size" size={15} color={colors.background} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={widthGesture(-1)}>
        <View style={[styles.pill, styles.left]} />
      </GestureDetector>
      <GestureDetector gesture={widthGesture(1)}>
        <View style={[styles.pill, styles.right]} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tl: { left: -K - HANDLE / 2, top: -K - HANDLE / 2 },
  tr: { right: -K - HANDLE / 2, top: -K - HANDLE / 2 },
  br: { right: -K - HANDLE / 2, bottom: -K - HANDLE / 2 },
  x1: {
    position: 'absolute',
    width: 13,
    height: 2,
    backgroundColor: colors.background,
    transform: [{ rotate: '45deg' }],
  },
  x2: {
    position: 'absolute',
    width: 13,
    height: 2,
    backgroundColor: colors.background,
    transform: [{ rotate: '-45deg' }],
  },
  pill: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 5,
    height: 36,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  left: { left: -3 },
  right: { right: -3 },
});
