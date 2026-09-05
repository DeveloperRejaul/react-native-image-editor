import { useEffect, useRef, type ComponentRef } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import type { ToolId } from '../types/editor.types';
import { Icon, type IconName } from '../../../components/Icon';
import { colors, radius, spacing } from '../../../theme';

interface EditorToolbarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  onReset: () => void;
  resetDisabled?: boolean;
}

const TOOLS: { id: ToolId; label: string; icon: IconName }[] = [
  { id: 'size', label: 'Size', icon: 'size' },
  { id: 'frame', label: 'Frame', icon: 'frame' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'sticker', label: 'Sticker', icon: 'sticker' },
  { id: 'filter', label: 'Filter', icon: 'filter' },
  { id: 'draw', label: 'Draw', icon: 'draw' },
];

export function EditorToolbar({
  activeTool,
  onSelectTool,
  onReset,
  resetDisabled = false,
}: EditorToolbarProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const layouts = useRef<Record<string, { x: number; w: number }>>({});
  const viewportW = useRef(0);

  useEffect(() => {
    const l = layouts.current[activeTool];
    const vw = viewportW.current;
    if (!l || vw <= 0) return;
    // Keep the active tool comfortably inside the viewport.
    const target = l.x + l.w / 2 - vw / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, target), animated: true });
  }, [activeTool]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.bar}
      onLayout={e => {
        viewportW.current = e.nativeEvent.layout.width;
      }}
    >
      <Tool
        label="Reset"
        icon="reset"
        onPress={onReset}
        disabled={resetDisabled}
        onLayout={e => {
          layouts.current.__reset = {
            x: e.nativeEvent.layout.x,
            w: e.nativeEvent.layout.width,
          };
        }}
      />
      {TOOLS.map(t => (
        <Tool
          key={t.id}
          label={t.label}
          icon={t.icon}
          active={activeTool === t.id}
          onPress={() => onSelectTool(t.id)}
          onLayout={e => {
            layouts.current[t.id] = {
              x: e.nativeEvent.layout.x,
              w: e.nativeEvent.layout.width,
            };
          }}
        />
      ))}
    </ScrollView>
  );
}

function Tool({
  label,
  icon,
  onPress,
  onLayout,
  disabled = false,
  active = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const tint = disabled ? colors.textMuted : active ? colors.primary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.tool,
        active && styles.toolActive,
        pressed && !disabled && styles.toolPressed,
      ]}
    >
      <Icon name={icon} size={20} color={tint} />
      <Text style={[styles.label, { color: tint }, disabled && styles.dim]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  bar: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  tool: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minWidth: 52,
  },
  toolActive: { backgroundColor: colors.background },
  toolPressed: { backgroundColor: colors.background },
  label: { fontSize: 11 },
  dim: { opacity: 0.5 },
});
