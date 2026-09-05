import { useCallback, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInUp,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { Icon, type IconName } from '../../../components/Icon';
import type { EditorImage, Overlay } from '../types/editor.types';
import type { EditorLayers } from '../hooks/useEditorLayers';
import { stickerPath } from '../constants/stickers';
import { colors, radius, spacing } from '../../../theme';

const CARD_H = 82;
const STEP = CARD_H + 8;

const CHECKER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAKklEQVR42mMwtbAliLT1jAkihlGDRg0aNQivQcQoIsayUYNGDRo1CC8CAJu/XND58tG/AAAAAElFTkSuQmCC';

export interface SpecialFlags {
  hidden: boolean;
  locked: boolean;
}

interface LayersPanelProps {
  onClose: () => void;
  layers: EditorLayers;
  image: EditorImage;
  frameSource?: number | string;
  selectedId: string | null;
  drawing: SpecialFlags;
  imageFlags: SpecialFlags;
  frameFlags: SpecialFlags;
  onToggleDrawing: (k: 'hidden' | 'locked') => void;
  onToggleImage: (k: 'hidden' | 'locked') => void;
  onToggleFrame: (k: 'hidden' | 'locked') => void;
  onSelectOverlay: (id: string) => void;
}

export function LayersPanel({
  onClose,
  layers,
  image,
  frameSource,
  selectedId,
  drawing,
  imageFlags,
  frameFlags,
  onToggleDrawing,
  onToggleImage,
  onToggleFrame,
  onSelectOverlay,
}: LayersPanelProps) {
  const [scrolling, setScrolling] = useState(true);
  const { overlays, reorderOverlay } = layers;
  const n = overlays.length;
  const displayOverlays = useMemo(() => [...overlays].reverse(), [overlays]);

  const onCommit = useCallback(
    (fromDisplay: number, dy: number) => {
      const toDisplay = Math.min(Math.max(fromDisplay + Math.round(dy / STEP), 0), n - 1);
      if (toDisplay !== fromDisplay) {
        reorderOverlay(n - 1 - fromDisplay, n - 1 - toDisplay);
      }
    },
    [n, reorderOverlay],
  );

  const pickOverlay = useCallback(
    (id: string, locked?: boolean) => {
      if (locked) return;
      onSelectOverlay(id);
      onClose();
    },
    [onSelectOverlay, onClose],
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={FadeInUp.duration(170)} exiting={FadeOut.duration(110)} style={styles.card}>
        <View style={styles.header}>
          <Icon name="layers" size={16} color={colors.text} />
          <Text style={styles.title}>Layers</Text>
          <View style={styles.flex} />
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <Icon name="close" size={15} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrolling}
        >
          {displayOverlays.map((o, di) => (
            <DraggableRow
              key={o.id}
              displayIndex={di}
              onCommit={onCommit}
              onTap={() => pickOverlay(o.id, o.locked)}
              onDragChange={setScrolling}
            >
              <LayerCard
                name={layerName(o)}
                selected={o.id === selectedId}
                hidden={!!o.hidden}
                locked={!!o.locked}
                onEye={() => layers.toggleOverlayHidden(o.id)}
                onLock={() => layers.toggleOverlayLocked(o.id)}
              >
                <OverlayPreview overlay={o} />
              </LayerCard>
            </DraggableRow>
          ))}

          {layers.strokes.length > 0 ? (
            <LayerCard
              name="Drawing"
              hidden={drawing.hidden}
              locked={drawing.locked}
              onEye={() => onToggleDrawing('hidden')}
              onLock={() => onToggleDrawing('locked')}
            >
              <Icon name="draw" size={28} color={colors.text} />
            </LayerCard>
          ) : null}

          {frameSource != null ? (
            <LayerCard
              name="Frame"
              hidden={frameFlags.hidden}
              locked={frameFlags.locked}
              onEye={() => onToggleFrame('hidden')}
              onLock={() => onToggleFrame('locked')}
            >
              <Image source={resolveSource(frameSource)} style={styles.fill} resizeMode="contain" />
            </LayerCard>
          ) : null}

          <LayerCard
            name="Image"
            hidden={imageFlags.hidden}
            locked={imageFlags.locked}
            onEye={() => onToggleImage('hidden')}
            onLock={() => onToggleImage('locked')}
          >
            <Image source={{ uri: image.uri }} style={styles.fill} resizeMode="cover" />
          </LayerCard>

          <LayerCard name="Background" locked lockOnly />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DraggableRow({
  displayIndex,
  onCommit,
  onTap,
  onDragChange,
  children,
}: {
  displayIndex: number;
  onCommit: (from: number, dy: number) => void;
  onTap: () => void;
  onDragChange: (scrolling: boolean) => void;
  children: React.ReactNode;
}) {
  const ty = useSharedValue(0);
  const active = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.Tap()
          .maxDuration(220)
          .onEnd(() => runOnJS(onTap)()),
        Gesture.Pan()
          .activateAfterLongPress(220)
          .onStart(() => {
            active.value = 1;
            runOnJS(onDragChange)(false);
          })
          .onUpdate(e => {
            ty.value = e.translationY;
          })
          .onEnd(e => {
            runOnJS(onCommit)(displayIndex, e.translationY);
          })
          .onFinalize(() => {
            ty.value = withTiming(0, { duration: 120 });
            active.value = 0;
            runOnJS(onDragChange)(true);
          }),
      ),
    [displayIndex, onCommit, onTap, onDragChange, ty, active],
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: active.value ? 1.03 : 1 }],
    zIndex: active.value ? 30 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}

function LayerCard({
  name,
  children,
  selected = false,
  hidden = false,
  locked = false,
  lockOnly = false,
  onEye,
  onLock,
}: {
  name: string;
  children?: React.ReactNode;
  selected?: boolean;
  hidden?: boolean;
  locked?: boolean;
  lockOnly?: boolean;
  onEye?: () => void;
  onLock?: () => void;
}) {
  return (
    <View style={styles.cardInner}>
      <View style={[styles.layerCard, selected && styles.layerCardSelected]}>
        <ImageBackground source={{ uri: CHECKER }} resizeMode="repeat" style={styles.fill}>
          <View style={[styles.preview, hidden && styles.previewHidden]}>{children}</View>
          {!lockOnly && onEye ? (
            <HandleBtn style={styles.eye} icon={hidden ? 'eyeOff' : 'eye'} label="Visibility" onPress={onEye} />
          ) : null}
          {onLock ? (
            <HandleBtn style={styles.lock} icon={locked ? 'lock' : 'unlock'} label="Lock" onPress={onLock} />
          ) : (
            <View style={[styles.handle, styles.lock]}>
              <Icon name="lock" size={13} color="#fff" />
            </View>
          )}
        </ImageBackground>
      </View>
      <Text style={styles.cardName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function HandleBtn({
  style,
  icon,
  label,
  onPress,
}: {
  style: object;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const tap = useMemo(() => Gesture.Tap().onEnd(() => runOnJS(onPress)()), [onPress]);
  return (
    <GestureDetector gesture={tap}>
      <View accessibilityRole="button" accessibilityLabel={label} style={[styles.handle, style]}>
        <Icon name={icon} size={13} color="#fff" />
      </View>
    </GestureDetector>
  );
}

function OverlayPreview({ overlay }: { overlay: Overlay }) {
  if (overlay.kind === 'text') {
    return (
      <Text style={[styles.previewText, { color: overlay.color }]} numberOfLines={1}>
        {overlay.text || 'Text'}
      </Text>
    );
  }
  if (overlay.imageUrl) {
    return <Image source={{ uri: overlay.imageUrl }} style={styles.fill} resizeMode="contain" />;
  }
  const shape = stickerPath(overlay.shape);
  if (!shape) return null;
  return (
    <Svg width={44} height={44} viewBox="-110 -110 220 220">
      <SvgPath
        d={shape.path}
        fill={shape.fill ? overlay.color : 'none'}
        stroke={overlay.color}
        strokeWidth={shape.fill ? 0 : 14}
      />
    </Svg>
  );
}

function layerName(o: Overlay): string {
  if (o.kind === 'text') return o.text.length > 16 ? `${o.text.slice(0, 16)}…` : o.text || 'Text';
  if (o.imageUrl) return 'Sticker';
  return (o.shape ?? 'Shape').replace(/^\w/, c => c.toUpperCase());
}

function resolveSource(src: number | string) {
  return typeof src === 'number' ? src : { uri: src };
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  card: {
    position: 'absolute',
    top: 84,
    right: 6,
    width: 168,
    maxHeight: '74%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  title: { color: colors.text, fontSize: 13, fontWeight: '700' },
  flex: { flex: 1 },
  scroll: { flexGrow: 0 },
  list: { paddingHorizontal: 8, paddingBottom: 8, gap: 8 },
  cardInner: { gap: 3 },
  layerCard: {
    height: CARD_H,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
  },
  layerCardSelected: { borderColor: colors.primary },
  fill: { width: '100%', height: '100%' },
  preview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  previewHidden: { opacity: 0.28 },
  previewText: { fontSize: 20, fontWeight: '800' },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: { top: 5, left: 5 },
  lock: { top: 5, right: 5 },
  cardName: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
