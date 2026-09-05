import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

interface LoadingViewProps {
  message?: string;
  /** Cover the whole parent with a dimmed backdrop (e.g. during export). */
  overlay?: boolean;
}

export function LoadingView({ message, overlay = false }: LoadingViewProps) {
  return (
    <View style={[styles.container, overlay && styles.overlay]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 0,
    backgroundColor: 'rgba(14,15,19,0.72)',
    zIndex: 10,
  },
  message: { color: colors.textMuted, fontSize: 14 },
});
