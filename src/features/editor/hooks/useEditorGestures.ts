import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Transforms3d } from '@shopify/react-native-skia';
import type { ImageTransform } from '../types/editor.types';
import { MAX_SCALE, MIN_SCALE } from '../../../constants/dimensions';
import { clamp } from '../utils/dimensions';
import { toSkiaTransform } from '../utils/transform';

export interface EditorGestures {
  /** Composed gesture to attach to a GestureDetector around the canvas. */
  gesture: ReturnType<typeof Gesture.Simultaneous>;
  /** Skia transform array, recomputed on the UI thread as the user manipulates. */
  transform: SharedValue<Transforms3d>;
  /** Live shared values, for reading the current transform on the JS thread. */
  values: {
    scale: SharedValue<number>;
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
    rotation: SharedValue<number>;
  };
  /** Animate back to the identity transform. */
  reset: () => void;
  /** Multiply the current zoom by `factor` (e.g. 1.25 in, 0.8 out), clamped. */
  zoomBy: (factor: number) => void;
  /** Read the current transform as a plain object (JS thread). */
  snapshot: () => ImageTransform;
}

/** Step used by the on-screen zoom buttons. */
export const ZOOM_STEP = 1.25;

/**
 * Pinch (zoom), pan (move) and rotation for the user image, all driven through
 * Reanimated shared values so gesture frames never touch React state. Scale and
 * rotation are anchored to the image centre (passed as <Image origin>).
 */
export function useEditorGestures(): EditorGestures {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .averageTouches(true)
      .onUpdate(e => {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const pinch = Gesture.Pinch()
      .onUpdate(e => {
        scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      });

    const rotate = Gesture.Rotation()
      .onUpdate(e => {
        rotation.value = savedRotation.value + e.rotation;
      })
      .onEnd(() => {
        savedRotation.value = rotation.value;
      });

    return Gesture.Simultaneous(pan, pinch, rotate);
  }, [
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    rotation,
    savedRotation,
  ]);

  const transform = useDerivedValue<Transforms3d>(() =>
    toSkiaTransform({
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
      rotation: rotation.value,
    }),
  );

  const reset = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    rotation.value = withTiming(0);
    savedRotation.value = 0;
  };

  const zoomBy = (factor: number) => {
    const next = Math.min(Math.max(scale.value * factor, MIN_SCALE), MAX_SCALE);
    scale.value = withTiming(next);
    savedScale.value = next;
  };

  const snapshot = (): ImageTransform => ({
    scale: scale.value,
    translateX: translateX.value,
    translateY: translateY.value,
    rotation: rotation.value,
  });

  return {
    gesture,
    transform,
    values: { scale, translateX, translateY, rotation },
    reset,
    zoomBy,
    snapshot,
  };
}
