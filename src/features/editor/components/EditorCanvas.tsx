import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  ColorMatrix,
  Fill,
  Group,
  Image as SkiaImage,
  Path,
  rect,
  Skia,
  Text as SkiaText,
  useImage,
  vec,
  type CanvasRef,
  type SkImage,
  type SkPath,
  type Transforms3d,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type {
  DrawStroke,
  Overlay,
  Rect as RectT,
  Size,
  StickerOverlay,
  TextOverlay,
} from '../types/editor.types';
import { stickerPath } from '../constants/stickers';
import { skiaFont } from '../utils/text';
import { colors } from '../../../theme';

interface EditorCanvasProps {
  canvasRef: React.RefObject<CanvasRef | null>;
  size: Size;
  image: SkImage | null;
  imageRect: RectT;
  transform: SharedValue<Transforms3d>;
  frameSource?: number | string;
  filterMatrix: number[] | null;
  overlays: Overlay[];
  strokes: DrawStroke[];
  /** Freehand path being drawn right now, updated on the UI thread. */
  livePath: SharedValue<string>;
  liveStroke: { color: string; width: number; erase: boolean };
  liveActive: boolean;
}

export function EditorCanvas({
  canvasRef,
  size,
  image,
  imageRect,
  transform,
  frameSource,
  filterMatrix,
  overlays,
  strokes,
  livePath,
  liveStroke,
  liveActive,
}: EditorCanvasProps) {
  const frame = useImage(frameSource ?? null);
  const clip = useMemo(() => rect(0, 0, size.width, size.height), [size.width, size.height]);
  const origin = useMemo(
    () => vec(imageRect.x + imageRect.width / 2, imageRect.y + imageRect.height / 2),
    [imageRect.x, imageRect.y, imageRect.width, imageRect.height],
  );
  const liveSkPath = useDerivedValue<SkPath>(
    () => Skia.Path.MakeFromSVGString(livePath.value) ?? Skia.Path.Make(),
    [livePath],
  );

  return (
    <View style={[styles.wrap, { width: size.width, height: size.height }]}>
      <Canvas ref={canvasRef} style={{ width: size.width, height: size.height }}>
        {/* Background */}
        <Fill color={colors.surface} />

        {/* User image + filter */}
        <Group clip={clip}>
          {image ? (
            <SkiaImage
              image={image}
              x={imageRect.x}
              y={imageRect.y}
              width={imageRect.width}
              height={imageRect.height}
              fit="fill"
              origin={origin}
              transform={transform}
            >
              {filterMatrix ? <ColorMatrix matrix={filterMatrix} /> : null}
            </SkiaImage>
          ) : null}
        </Group>

        {/* Frame */}
        {frame ? (
          <SkiaImage image={frame} x={0} y={0} width={size.width} height={size.height} fit="fill" />
        ) : null}

        {/* Drawing — isolated layer so eraser strokes can clear earlier ones */}
        {strokes.length > 0 || liveActive ? (
          <Group layer clip={clip}>
            {strokes.map(s => (
              <StrokeNode key={s.id} stroke={s} />
            ))}
            {liveActive ? (
              <Path
                path={liveSkPath}
                color={liveStroke.erase ? colors.background : liveStroke.color}
                style="stroke"
                strokeWidth={liveStroke.width}
                strokeJoin="round"
                strokeCap="round"
                blendMode={liveStroke.erase ? 'clear' : 'srcOver'}
              />
            ) : null}
          </Group>
        ) : null}

        {/* Text + stickers. The Group is keyed by the layer order so Skia
            rebuilds its draw list when layers are reordered. */}
        <Group key={overlays.map(o => o.id).join('|')}>
          {overlays.map(o =>
            o.kind === 'text' ? (
              <TextNode key={o.id} overlay={o} />
            ) : (
              <StickerNode key={o.id} overlay={o} />
            ),
          )}
        </Group>
      </Canvas>
    </View>
  );
}

function overlayTransform(o: Overlay): Transforms3d {
  return [
    { translateX: o.x },
    { translateY: o.y },
    { rotate: o.rotation },
    { scale: o.scale },
    { scaleX: o.scaleX ?? 1 },
  ];
}

function TextNode({ overlay }: { overlay: TextOverlay }) {
  const font = useMemo(
    () => skiaFont(overlay.familyId, overlay.styleId, overlay.fontSize),
    [overlay.familyId, overlay.styleId, overlay.fontSize],
  );
  return (
    <Group transform={overlayTransform(overlay)}>
      <SkiaText
        x={-overlay.halfWidth}
        y={overlay.fontSize * 0.35}
        text={overlay.text}
        font={font}
        color={overlay.color}
      />
    </Group>
  );
}

function StickerNode({ overlay }: { overlay: StickerOverlay }) {
  const img = useImage(overlay.imageUrl ?? null);
  const shape = overlay.imageUrl ? undefined : stickerPath(overlay.shape);
  const path = useMemo(
    () => (shape ? Skia.Path.MakeFromSVGString(shape.path) : null),
    [shape],
  );
  const hw = overlay.halfWidth;
  const hh = overlay.halfHeight;

  return (
    <Group transform={overlayTransform(overlay)}>
      {overlay.imageUrl && img ? (
        <SkiaImage image={img} x={-hw} y={-hh} width={hw * 2} height={hh * 2} fit="contain" />
      ) : path && shape ? (
        <Path
          path={path}
          color={overlay.color}
          style={shape.fill ? 'fill' : 'stroke'}
          strokeWidth={10}
          strokeJoin="round"
          strokeCap="round"
        />
      ) : null}
    </Group>
  );
}

function StrokeNode({ stroke }: { stroke: DrawStroke }) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(stroke.path), [stroke.path]);
  if (!path) return null;
  return (
    <Path
      path={path}
      color={stroke.erase ? colors.background : stroke.color}
      style="stroke"
      strokeWidth={stroke.width}
      strokeJoin="round"
      strokeCap="round"
      blendMode={stroke.erase ? 'clear' : 'srcOver'}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
