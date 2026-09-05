import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme';
import { MAX_RATIO, MIN_RATIO } from '../constants/workspace';

interface CustomSizeModalProps {
  visible: boolean;
  /** Seed the W/H fields from the current ratio. */
  ratio: number;
  onCancel: () => void;
  onSubmit: (ratio: number) => void;
}

export function CustomSizeModal({ visible, ratio, onCancel, onSubmit }: CustomSizeModalProps) {
  const [w, setW] = useState('');
  const [h, setH] = useState('');

  useEffect(() => {
    if (visible) {
      // Seed with a round pair that matches the current ratio.
      if (ratio >= 1) {
        setW(String(Math.round(ratio * 1000)));
        setH('1000');
      } else {
        setW('1000');
        setH(String(Math.round(1000 / ratio)));
      }
    }
  }, [visible, ratio]);

  const nw = parseFloat(w);
  const nh = parseFloat(h);
  const valid = nw > 0 && nh > 0;
  const preview = valid ? nw / nh : ratio;
  const inRange = preview >= MIN_RATIO && preview <= MAX_RATIO;

  const box = 80;
  const bw = preview >= 1 ? box : box * preview;
  const bh = preview >= 1 ? box / preview : box;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Custom size</Text>

          <View style={styles.previewRow}>
            <View style={[styles.previewBox, { width: Math.round(bw), height: Math.round(bh) }]} />
          </View>

          <View style={styles.inputs}>
            <TextInput
              value={w}
              onChangeText={setW}
              placeholder="Width"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={6}
            />
            <Text style={styles.times}>×</Text>
            <TextInput
              value={h}
              onChangeText={setH}
              placeholder="Height"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={6}
            />
          </View>

          {!inRange && valid ? (
            <Text style={styles.warn}>That ratio is outside the supported range.</Text>
          ) : null}

          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.flex}>
              <Button
                label="Apply"
                disabled={!valid || !inRange}
                onPress={() => onSubmit(preview)}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  previewRow: { alignItems: 'center', height: 90, justifyContent: 'center' },
  previewBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  inputs: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  times: { color: colors.textMuted, fontSize: 16 },
  warn: { color: colors.accent, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
