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

interface TextEditorModalProps {
  visible: boolean;
  initialText?: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}

export function TextEditorModal({
  visible,
  initialText = '',
  onCancel,
  onSubmit,
}: TextEditorModalProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) setText(initialText);
  }, [visible, initialText]);

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      onCancel();
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{initialText ? 'Edit text' : 'Add text'}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type something…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            multiline
            maxLength={120}
          />
          <View style={styles.actions}>
            <View style={styles.actionBtn}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.actionBtn}>
              <Button label={initialText ? 'Save' : 'Add'} onPress={submit} />
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
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  input: {
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1 },
});
