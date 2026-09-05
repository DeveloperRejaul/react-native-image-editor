import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Frame } from '../types/editor.types';
import { NO_FRAME_ID } from '../types/editor.types';
import { colors, radius, spacing } from '../../../theme';

interface FrameSelectorProps {
  frames: Frame[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Invoked when the user taps the "import from device" tile. */
  onImport: () => void;
  importing?: boolean;
}

const IMPORT_ID = '__import__';

export function FrameSelector({
  frames,
  selectedId,
  onSelect,
  onImport,
  importing = false,
}: FrameSelectorProps) {
  const data: (Frame | typeof IMPORT_SENTINEL)[] = [...frames, IMPORT_SENTINEL];
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={item => ('id' in item ? item.id : IMPORT_ID)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) =>
        'id' in item ? (
          <FrameTile
            frame={item}
            selected={item.id === selectedId}
            onPress={() => onSelect(item.id)}
          />
        ) : (
          <ImportTile onPress={onImport} busy={importing} />
        )
      }
    />
  );
}

const IMPORT_SENTINEL = { import: true } as const;

function FrameTile({
  frame,
  selected,
  onPress,
}: {
  frame: Frame;
  selected: boolean;
  onPress: () => void;
}) {
  const isNone = frame.id === NO_FRAME_ID;
  const uriSource = frame.imageUrl ? { uri: frame.imageUrl } : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Frame: ${frame.name}`}
      onPress={onPress}
      style={styles.tile}
    >
      {isNone || (frame.source == null && !uriSource) ? (
        <View style={[styles.noneSwatch, selected && styles.selectedRing]}>
          <Text style={styles.noneGlyph}>⌀</Text>
        </View>
      ) : (
        <View style={[styles.thumb, selected && styles.selectedRing]}>
          <Image
            source={uriSource ?? frame.source}
            style={styles.thumbImage}
            resizeMode="cover"
          />
        </View>
      )}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {frame.name}
      </Text>
    </Pressable>
  );
}

function ImportTile({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Import a frame from your device"
      accessibilityState={{ busy }}
      onPress={onPress}
      disabled={busy}
      style={styles.tile}
    >
      <View style={[styles.thumb, styles.importSwatch]}>
        <Text style={styles.importGlyph}>{busy ? '…' : '＋'}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        Import
      </Text>
    </Pressable>
  );
}

const TILE = 64;

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  tile: { width: TILE, alignItems: 'center', gap: 6 },
  selectedRing: { borderColor: colors.primary },
  thumb: {
    width: TILE,
    height: TILE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#8A8F99',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbImage: { width: '100%', height: '100%' },
  noneSwatch: {
    width: TILE,
    height: TILE,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneGlyph: { color: colors.textMuted, fontSize: 22 },
  importSwatch: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importGlyph: { color: colors.primary, fontSize: 24, fontWeight: '600' },
  label: { color: colors.textMuted, fontSize: 12, maxWidth: TILE },
  labelSelected: { color: colors.text, fontWeight: '600' },
});
