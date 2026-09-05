import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';

interface IconButtonProps {
  /** Short glyph or label, e.g. a chevron or "Save". */
  glyph: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  tone?: 'default' | 'primary';
}

export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
  disabled = false,
  tone = 'default',
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.glyph, tone === 'primary' && styles.primary]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  glyph: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primary: { color: colors.primary },
});
