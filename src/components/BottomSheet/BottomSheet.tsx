import { useCallback, useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../theme';

interface BottomSheetProps {
  title?: string;
  /** Changing this key re-plays the slide-up animation (e.g. on tool switch). */
  contentKey?: string;
  /** Controlled open state. Swiping the grip down calls `onClose`. */
  open?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

/** Slide up from below + fade in (content swap). */
function slideUp() {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 24 }] },
    animations: {
      opacity: withTiming(1, { duration: 190 }),
      transform: [{ translateY: withTiming(0, { duration: 240 }) }],
    },
  };
}

/**
 * Bottom panel used by the editor for the tool controls. Hugs its content
 * height, slides up from the bottom on a tool switch, and can be dragged
 * down by its grip to dismiss (re-opened by picking a tool).
 */
export function BottomSheet({ title, contentKey, open = true, onClose, children }: BottomSheetProps) {
  const height = useSharedValue(320);
  const progress = useSharedValue(1); // 1 = open, 0 = dismissed

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 230 });
  }, [open, progress]);

  const requestClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height.value }],
    opacity: 0.25 + 0.75 * progress.value,
  }));

  const drag = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY <= 0) {
        progress.value = 1;
        return;
      }
      const p = 1 - e.translationY / Math.max(height.value, 1);
      progress.value = p < 0 ? 0 : p;
    })
    .onEnd(e => {
      if (e.translationY > 70 || e.velocityY > 700) {
        progress.value = withTiming(0, { duration: 160 });
        runOnJS(requestClose)();
      } else {
        progress.value = withTiming(1, { duration: 160 });
      }
    });

  return (
    <Animated.View
      style={[styles.container, sheetStyle]}
      onLayout={e => {
        height.value = e.nativeEvent.layout.height;
      }}
    >
      <GestureDetector gesture={drag}>
        <View style={styles.grip}>
          <View style={styles.gripBar} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
      </GestureDetector>
      <Animated.View key={contentKey} entering={slideUp} exiting={FadeOut.duration(110)}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  grip: {
    paddingTop: 6,
    paddingBottom: spacing.xs,
  },
  gripBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
  },
});
