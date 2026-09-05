import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { colors, radius } from '../../../theme';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
}

/** Explicit zoom in / out, next to pinch-to-zoom for precise or one-handed use. */
export function ZoomControls({ onZoomIn, onZoomOut, disabled = false }: ZoomControlsProps) {
  return (
    <View style={[styles.pill, disabled && styles.disabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        onPress={onZoomIn}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Icon name="plus" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        onPress={onZoomOut}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Icon name="minus" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(26,28,34,0.9)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  disabled: { opacity: 0.4 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surface },
  divider: { height: 1, backgroundColor: colors.border },
});
