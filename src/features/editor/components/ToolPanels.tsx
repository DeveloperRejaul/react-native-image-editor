import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  type SkImage,
} from '@shopify/react-native-skia';
import type { FilterId, Overlay } from '../types/editor.types';
import { FILTERS } from '../constants/filters';
import { STICKERS, STICKER_COLORS } from '../constants/stickers';
import { TEXT_FAMILIES, TEXT_STYLES } from '../constants/fonts';
import {
  formatRatio,
  nearestPresetId,
  WORKSPACE_PRESETS,
} from '../constants/workspace';
import { Icon } from '../../../components/Icon';
import { Slider } from '../../../components/Slider';
import { colors, radius, spacing } from '../../../theme';

/* -------- Workspace size -------- */

/** A bordered rectangle scaled to `ratio` (w/h), fitting a `box` square. */
function RatioGlyph({ ratio, box, active }: { ratio: number; box: number; active?: boolean }) {
  const w = ratio >= 1 ? box : Math.max(6, box * ratio);
  const h = ratio >= 1 ? Math.max(6, box / ratio) : box;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          styles.ratioBox,
          { width: Math.round(w), height: Math.round(h) },
          active && styles.ratioBoxActive,
        ]}
      />
    </View>
  );
}

export function WorkspacePanel({
  ratio,
  onRatio,
  onNudge,
  onCustom,
}: {
  ratio: number;
  onRatio: (r: number) => void;
  onNudge: (dir: 1 | -1) => void;
  onCustom: () => void;
}) {
  const activeId = nearestPresetId(ratio);
  return (
    <View style={styles.wsStack}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.wsPresets}
      >
        {WORKSPACE_PRESETS.map(p => {
          const selected = p.id === activeId;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Ratio ${p.label}`}
              accessibilityState={{ selected }}
              onPress={() => onRatio(p.ratio)}
              style={styles.wsPreset}
            >
              <RatioGlyph ratio={p.ratio} box={22} active={selected} />
              <Text style={[styles.wsPresetLabel, selected && styles.smallLabelSelected]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Custom size"
          onPress={onCustom}
          style={styles.wsCustomBtn}
        >
          <Icon name="plus" size={16} color={colors.primary} />
        </Pressable>
      </ScrollView>

      <View style={styles.wsNudge}>
        <Pressable onPress={() => onNudge(-1)} accessibilityLabel="Narrower" style={styles.sqBtnSm}>
          <Icon name="minus" size={15} color={colors.text} />
        </Pressable>
        <Text style={styles.hint}>{formatRatio(ratio)}</Text>
        <Pressable onPress={() => onNudge(1)} accessibilityLabel="Wider" style={styles.sqBtnSm}>
          <Icon name="plus" size={15} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

/* -------- Filter presets with live thumbnails -------- */

export function FilterStrip({
  value,
  onChange,
  image,
}: {
  value: FilterId;
  onChange: (id: FilterId) => void;
  image: SkImage | null;
}) {
  return (
    <FlatList
      horizontal
      data={FILTERS}
      keyExtractor={f => f.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const selected = item.id === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${item.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(item.id)}
            style={styles.filterTile}
          >
            <View style={[styles.filterThumb, selected && styles.selectedRing]}>
              {image ? (
                <Canvas style={styles.filterCanvas}>
                  <SkiaImage image={image} x={0} y={0} width={THUMB} height={THUMB} fit="cover">
                    {item.matrix ? <ColorMatrix matrix={item.matrix} /> : null}
                  </SkiaImage>
                </Canvas>
              ) : null}
            </View>
            <Text style={[styles.smallLabel, selected && styles.smallLabelSelected]}>
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

/* -------- Sticker tray -------- */

export function StickerTray({
  color,
  onColor,
  onCustomColor,
  onPick,
  onImport,
  importing = false,
}: {
  color: string;
  onColor: (c: string) => void;
  onCustomColor: () => void;
  onPick: (shapeId: string) => void;
  onImport: () => void;
  importing?: boolean;
}) {
  return (
    <View style={styles.stack}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {STICKERS.map(s => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`Add ${s.label} sticker`}
            onPress={() => onPick(s.id)}
            style={styles.stickerTile}
          >
            <Svg width={40} height={40} viewBox="-110 -110 220 220">
              <SvgPath
                d={s.path}
                fill={s.fill ? color : 'none'}
                stroke={color}
                strokeWidth={s.fill ? 0 : 14}
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import a sticker from your device"
          onPress={onImport}
          disabled={importing}
          style={[styles.stickerTile, styles.importTile]}
        >
          <Icon name="image" size={22} color={colors.primary} />
        </Pressable>
      </ScrollView>
      <Swatches value={color} onChange={onColor} onCustom={onCustomColor} />
    </View>
  );
}

/* -------- Draw controls -------- */

export function DrawControls({
  color,
  size,
  erase,
  onColor,
  onCustomColor,
  onSize,
  onToggleErase,
  onUndo,
  onClear,
  canUndo,
}: {
  color: string;
  size: number;
  erase: boolean;
  onColor: (c: string) => void;
  onCustomColor: () => void;
  onSize: (n: number) => void;
  onToggleErase: (v: boolean) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onToggleErase(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: !erase }}
          style={[styles.modeBtn, !erase && styles.modeBtnActive]}
        >
          <Icon name="draw" size={16} color={!erase ? colors.primary : colors.text} />
          <Text style={[styles.smallLabel, !erase && styles.smallLabelSelected]}>Brush</Text>
        </Pressable>
        <Pressable
          onPress={() => onToggleErase(true)}
          accessibilityRole="button"
          accessibilityState={{ selected: erase }}
          style={[styles.modeBtn, erase && styles.modeBtnActive]}
        >
          <Icon name="trash" size={16} color={erase ? colors.primary : colors.text} />
          <Text style={[styles.smallLabel, erase && styles.smallLabelSelected]}>Eraser</Text>
        </Pressable>
        <View style={styles.spacer} />
        <Pressable onPress={onUndo} disabled={!canUndo} style={[styles.textBtn, !canUndo && styles.disabled]}>
          <Icon name="undo" size={18} color={colors.text} />
        </Pressable>
        <Pressable onPress={onClear} disabled={!canUndo} style={[styles.textBtn, !canUndo && styles.disabled]}>
          <Text style={[styles.textBtnLabel, { color: colors.accent }]}>Clear</Text>
        </Pressable>
      </View>

      {/* preset sizes + live preview of the current brush */}
      <View style={[styles.row, styles.centerRow]}>
        {BRUSH_PRESETS.map(n => {
          const selected = n === size;
          const dot = Math.min(n, 26);
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Brush size ${n}`}
              accessibilityState={{ selected }}
              onPress={() => onSize(n)}
              style={[styles.presetDot, selected && styles.presetDotSelected]}
            >
              <View
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: erase ? colors.textMuted : color,
                }}
              />
            </Pressable>
          );
        })}
        <View style={styles.spacer} />
        <View style={styles.previewWell}>
          <View
            style={{
              width: Math.min(Math.max(size, 3), 44),
              height: Math.min(Math.max(size, 3), 44),
              borderRadius: 22,
              backgroundColor: erase ? colors.textMuted : color,
            }}
          />
        </View>
      </View>

      <View style={styles.sliderRow}>
        <Slider value={size} min={2} max={48} step={1} onChange={onSize} label={`${size} px`} />
      </View>

      {erase ? null : <Swatches value={color} onChange={onColor} onCustom={onCustomColor} />}
    </View>
  );
}

const BRUSH_PRESETS = [2, 6, 12, 22, 36];

/* -------- Text tool (no selection yet) -------- */

export function TextToolPanel({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={[styles.row, styles.centerRow]}>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add text"
        style={styles.addTextBtn}
      >
        <Icon name="text" size={18} color={colors.text} />
        <Text style={styles.addTextLabel}>Add text</Text>
      </Pressable>
      <Text style={styles.hint}>Tap a text item on the photo to restyle it</Text>
    </View>
  );
}

/* -------- Selected overlay controls (text / sticker) -------- */

function ChipRow<T extends { id: string; label: string }>({
  items,
  selectedId,
  onSelect,
  preview,
  flat = false,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Per-item text style so the chip label renders in that actual font/style. */
  preview?: (item: T) => StyleProp<TextStyle>;
  /** Flat underline-style row (used for the font variant), vs bordered chips. */
  flat?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map(it => {
        const selected = it.id === selectedId;
        if (flat) {
          return (
            <Pressable
              key={it.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(it.id)}
              style={[styles.variant, selected && styles.variantSelected]}
            >
              <Text
                style={[styles.variantLabel, selected && styles.variantLabelSelected, preview?.(it)]}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={it.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(it.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              style={[styles.chipLabel, selected && styles.chipLabelSelected, preview?.(it)]}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function OverlayControls({
  overlay,
  onFamily,
  onStyle,
  onColor,
  onCustomColor,
}: {
  overlay: Overlay;
  onFamily: (id: string) => void;
  onStyle: (id: string) => void;
  onColor: (c: string) => void;
  onCustomColor: () => void;
}) {
  const isText = overlay.kind === 'text';
  const isImageSticker = overlay.kind === 'sticker' && !!overlay.imageUrl;
  return (
    <View style={styles.stack}>
      {isText ? (
        <>
          <ChipRow
            items={TEXT_FAMILIES}
            selectedId={overlay.familyId}
            onSelect={onFamily}
            preview={f => ({ fontFamily: f.family })}
          />
          <ChipRow
            items={TEXT_STYLES}
            selectedId={overlay.styleId}
            onSelect={onStyle}
            preview={s => ({ fontWeight: s.weight, fontStyle: s.style })}
            flat
          />
        </>
      ) : null}

      <View style={styles.row}>
        {isImageSticker ? (
          <Text style={styles.hint}>Drag, pinch or rotate with the handles</Text>
        ) : (
          <Swatches value={overlay.color} onChange={onColor} onCustom={onCustomColor} compact />
        )}
      </View>
    </View>
  );
}

/* -------- shared swatches -------- */

function Swatches({
  value,
  onChange,
  onCustom,
  compact = false,
}: {
  value: string;
  onChange: (c: string) => void;
  onCustom: () => void;
  compact?: boolean;
}) {
  const sz = compact ? 24 : 28;
  return (
    <View style={[styles.swatchRow, !compact && styles.swatchRowPad]}>
      {STICKER_COLORS.map(c => (
        <Pressable
          key={c}
          accessibilityRole="button"
          accessibilityLabel={`Colour ${c}`}
          accessibilityState={{ selected: c.toUpperCase() === value.toUpperCase() }}
          onPress={() => onChange(c)}
          style={[
            { width: sz, height: sz, borderRadius: sz / 2 },
            styles.swatch,
            { backgroundColor: c },
            c.toUpperCase() === value.toUpperCase() && styles.swatchSelected,
          ]}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Custom colour"
        onPress={onCustom}
        style={[{ width: sz, height: sz, borderRadius: sz / 2 }, styles.swatch, styles.customSwatch]}
      >
        <Icon name="plus" size={14} color={colors.text} />
      </Pressable>
    </View>
  );
}

const THUMB = 56;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  centerRow: { paddingVertical: spacing.xs },
  stack: { gap: spacing.sm, paddingBottom: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipLabelSelected: { color: colors.text },
  italic: { fontStyle: 'italic' },
  variant: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  variantSelected: { borderBottomColor: colors.primary },
  variantLabel: { color: colors.textMuted, fontSize: 13 },
  variantLabelSelected: { color: colors.text },
  selectedRing: { borderColor: colors.primary },
  smallLabel: { color: colors.textMuted, fontSize: 11 },
  smallLabelSelected: { color: colors.text, fontWeight: '600' },

  filterTile: { alignItems: 'center', gap: 4, width: THUMB },
  filterThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterCanvas: { width: THUMB, height: THUMB },

  stickerTile: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  importTile: { borderStyle: 'dashed' },

  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { borderColor: colors.primary },
  sliderRow: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  addTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  addTextLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ratioBox: {
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    borderRadius: 3,
  },
  ratioBoxActive: { borderColor: colors.primary },
  wsStack: { gap: spacing.sm, paddingBottom: spacing.xs },
  wsPresets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  wsPreset: { alignItems: 'center', gap: 2, width: 34 },
  wsPresetLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  wsCustomBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  wsNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sqBtnSm: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetDot: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetDotSelected: { borderColor: colors.primary },
  previewWell: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  spacer: { flex: 1 },
  textBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6 },
  textBtnLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  sqBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.4 },
  hint: { color: colors.textMuted, fontSize: 12 },

  swatchInline: { flexShrink: 1 },
  swatchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  swatchRowPad: { paddingHorizontal: spacing.lg },
  swatch: { borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderColor: colors.primary },
  customSwatch: { backgroundColor: colors.surface, borderColor: colors.border },
});
