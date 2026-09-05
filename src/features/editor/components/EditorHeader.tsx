import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../../../components/Icon';
import { colors, spacing } from '../../../theme';
import { HEADER_HEIGHT } from '../../../constants/dimensions';

interface EditorHeaderProps {
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  busy?: boolean;
  actionsDisabled?: boolean;
}

export function EditorHeader({
  onClose,
  onSave,
  onShare,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  busy = false,
  actionsDisabled = false,
}: EditorHeaderProps) {
  return (
    <View style={styles.header}>
      <CircleButton icon="close" label="Close editor" onPress={onClose} />

      <View style={styles.pill}>
        <PillButton icon="undo" label="Undo" onPress={onUndo} disabled={!canUndo} />
        <PillButton icon="redo" label="Redo" onPress={onRedo} disabled={!canRedo} />
      </View>

      <View style={styles.spacer} />

      {busy ? (
        <View style={styles.circle}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <>
          <CircleButton
            icon="download"
            label="Save to Photos"
            onPress={onSave}
            disabled={actionsDisabled}
          />
          <CircleButton
            icon="share"
            label="Share image"
            onPress={onShare}
            disabled={actionsDisabled}
          />
        </>
      )}
    </View>
  );
}

function CircleButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

function PillButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillBtn,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={19} color={colors.text} />
    </Pressable>
  );
}

const SIZE = 40;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: SIZE / 2,
    paddingHorizontal: 4,
  },
  pillBtn: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.3 },
});
