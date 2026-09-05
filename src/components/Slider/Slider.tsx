import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Icon } from '../Icon';
import { colors, radius, spacing } from '../../theme';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Text shown in a tooltip above the thumb. */
  label?: string;
  /** Show +/- buttons on the sides. */
  buttons?: boolean;
}

const ROW_H = 36;
const THUMB = 18;

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  buttons = true,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const pct = max > min ? (value - min) / (max - min) : 0;

  const setFromX = (x: number) => {
    if (width <= 0) return;
    onChange(clamp(min + (x / width) * (max - min)));
  };

  const pan = Gesture.Pan()
    .onBegin(e => runOnJS(setFromX)(e.x))
    .onUpdate(e => runOnJS(setFromX)(e.x));
  const tap = Gesture.Tap().onEnd(e => runOnJS(setFromX)(e.x));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.row}>
      {buttons ? (
        <Pressable
          onPress={() => onChange(clamp(value - step))}
          accessibilityRole="button"
          accessibilityLabel="Decrease"
          style={styles.btn}
        >
          <Icon name="minus" size={18} color={colors.text} />
        </Pressable>
      ) : null}

      <GestureDetector gesture={Gesture.Race(tap, pan)}>
        <View style={styles.track} onLayout={onLayout}>
          <View style={styles.rail} />
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          <View style={[styles.thumb, { left: `${pct * 100}%` }]} />
          {label ? (
            <View style={[styles.tooltip, { left: `${pct * 100}%` }]} pointerEvents="none">
              <Text style={styles.tooltipText}>{label}</Text>
              <View style={styles.tooltipArrow} />
            </View>
          ) : null}
        </View>
      </GestureDetector>

      {buttons ? (
        <Pressable
          onPress={() => onChange(clamp(value + step))}
          accessibilityRole="button"
          accessibilityLabel="Increase"
          style={styles.btn}
        >
          <Icon name="plus" size={18} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: ROW_H },
  btn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  track: { flex: 1, height: ROW_H, justifyContent: 'center' },
  rail: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  fill: {
    position: 'absolute',
    top: ROW_H / 2 - 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: ROW_H / 2 - THUMB / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    marginLeft: -THUMB / 2,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tooltip: {
    position: 'absolute',
    top: -20,
    marginLeft: -24,
    width: 48,
    alignItems: 'center',
    zIndex: 5,
  },
  tooltipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
});
