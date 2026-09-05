import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Modal, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Button } from '../Button';
import { colors, radius, spacing } from '../../theme';

interface ColorPickerProps {
  visible: boolean;
  value: string;
  onCancel: () => void;
  onSubmit: (hex: string) => void;
}

/* ---- colour maths ---- */
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, v: 1 };
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ColorPicker({ visible, value, onCancel, onSubmit }: ColorPickerProps) {
  const initial = useMemo(() => hexToHsv(value), [value]);
  const [h, setH] = useState(initial.h);
  const [s, setS] = useState(initial.s);
  const [v, setV] = useState(initial.v);
  const [panel, setPanel] = useState({ w: 0, hgt: 0 });
  const [hueW, setHueW] = useState(0);

  // Re-seed when opened with a new value.
  useMemo(() => {
    if (visible) {
      setH(initial.h);
      setS(initial.s);
      setV(initial.v);
    }
  }, [visible, initial.h, initial.s, initial.v]);

  const hex = hsvToHex(h, s, v);
  const hueHex = hsvToHex(h, 1, 1);

  const onPanelLayout = (e: LayoutChangeEvent) =>
    setPanel({ w: e.nativeEvent.layout.width, hgt: e.nativeEvent.layout.height });
  const setSV = (x: number, y: number) => {
    if (panel.w <= 0) return;
    setS(clamp01(x / panel.w));
    setV(1 - clamp01(y / panel.hgt));
  };
  const svGesture = Gesture.Race(
    Gesture.Tap().onEnd(e => runOnJS(setSV)(e.x, e.y)),
    Gesture.Pan()
      .onBegin(e => runOnJS(setSV)(e.x, e.y))
      .onUpdate(e => runOnJS(setSV)(e.x, e.y)),
  );

  const setHue = (x: number) => {
    if (hueW <= 0) return;
    setH(clamp01(x / hueW) * 360);
  };
  const hueGesture = Gesture.Race(
    Gesture.Tap().onEnd(e => runOnJS(setHue)(e.x)),
    Gesture.Pan()
      .onBegin(e => runOnJS(setHue)(e.x))
      .onUpdate(e => runOnJS(setHue)(e.x)),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Custom colour</Text>
            <View style={[styles.preview, { backgroundColor: hex }]} />
            <Text style={styles.hex}>{hex}</Text>
          </View>

          <GestureDetector gesture={svGesture}>
            <View style={styles.panel} onLayout={onPanelLayout}>
              <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="sat" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#ffffff" />
                    <Stop offset="1" stopColor={hueHex} />
                  </LinearGradient>
                  <LinearGradient id="val" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                    <Stop offset="1" stopColor="#000000" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#sat)" />
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#val)" />
              </Svg>
              <View
                pointerEvents="none"
                style={[
                  styles.svThumb,
                  { left: `${s * 100}%`, top: `${(1 - v) * 100}%` },
                ]}
              />
            </View>
          </GestureDetector>

          <GestureDetector gesture={hueGesture}>
            <View
              style={styles.hueTrack}
              onLayout={e => setHueW(e.nativeEvent.layout.width)}
            >
              <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="hue" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#ff0000" />
                    <Stop offset="0.17" stopColor="#ffff00" />
                    <Stop offset="0.33" stopColor="#00ff00" />
                    <Stop offset="0.5" stopColor="#00ffff" />
                    <Stop offset="0.67" stopColor="#0000ff" />
                    <Stop offset="0.83" stopColor="#ff00ff" />
                    <Stop offset="1" stopColor="#ff0000" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" rx="6" fill="url(#hue)" />
              </Svg>
              <View pointerEvents="none" style={[styles.hueThumb, { left: `${(h / 360) * 100}%` }]} />
            </View>
          </GestureDetector>

          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.flex}>
              <Button label="Use colour" onPress={() => onSubmit(hex)} />
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  preview: { width: 26, height: 26, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  hex: { color: colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'] },
  panel: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  svThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hueTrack: { height: 20, borderRadius: 6, overflow: 'hidden', justifyContent: 'center' },
  hueThumb: {
    position: 'absolute',
    width: 6,
    height: 20,
    marginLeft: -3,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
