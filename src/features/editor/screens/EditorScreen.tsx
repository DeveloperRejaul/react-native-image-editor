import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCanvasRef } from '@shopify/react-native-skia';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../../components/Button';
import { LoadingView } from '../../../components/LoadingView';
import { BottomSheet } from '../../../components/BottomSheet';
import { ColorPicker } from '../../../components/ColorPicker';
import { colors, spacing } from '../../../theme';
import { DEFAULT_FRAME_ID, FRAMES } from '../../../constants/frames';
import type { RootStackParamList } from '../../../navigation/types';
import type { DrawStroke, FilterId, Frame, Overlay, Size, ToolId } from '../types/editor.types';
import { clamp, fitAspect } from '../utils/dimensions';
import { DEFAULT_TEXT_SIZE, measureTextHalfWidth } from '../utils/text';
import { DEFAULT_FAMILY_ID, DEFAULT_STYLE_ID } from '../constants/fonts';
import { filterMatrix } from '../constants/filters';
import { STICKER_COLORS } from '../constants/stickers';
import {
  DEFAULT_WORKSPACE,
  MAX_RATIO,
  MIN_RATIO,
  RATIO_STEP,
} from '../constants/workspace';
import { useEditorImage } from '../hooks/useEditorImage';
import { useEditorGestures, ZOOM_STEP } from '../hooks/useEditorGestures';
import { useEditorExport } from '../hooks/useEditorExport';
import { useEditorLayers } from '../hooks/useEditorLayers';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useFrameImport } from '../hooks/useFrameImport';
import { useImageImport } from '../hooks/useImageImport';
import { EditorHeader } from '../components/EditorHeader';
import { EditorCanvas } from '../components/EditorCanvas';
import { FrameSelector } from '../components/FrameSelector';
import { EditorToolbar } from '../components/EditorToolbar';
import { ZoomControls } from '../components/ZoomControls';
import { SelectionGizmo } from '../components/SelectionGizmo';
import { LayersPanel } from '../components/LayersPanel';
import { Icon } from '../../../components/Icon';
import { TextEditorModal } from '../components/TextEditorModal';
import { CustomSizeModal } from '../components/CustomSizeModal';
import {
  DrawControls,
  FilterStrip,
  OverlayControls,
  StickerTray,
  TextToolPanel,
  WorkspacePanel,
} from '../components/ToolPanels';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

interface EditorDoc {
  overlays: Overlay[];
  strokes: DrawStroke[];
  filter: FilterId;
  frameId: string;
  aspect: number;
}

type ColorTarget = 'sticker' | 'draw' | 'overlay';

const NO_STROKES: DrawStroke[] = [];

export function EditorScreen({ navigation, route }: Props) {
  const { image } = route.params;
  const insets = useSafeAreaInsets();

  const canvasRef = useCanvasRef();
  const { skImage, loading, error, getFittedRect } = useEditorImage(image);
  const imageGestures = useEditorGestures();
  const { save, share, exporting } = useEditorExport();
  const layers = useEditorLayers();
  const { importFrame, importing: importingFrame, error: frameError, clearError: clearFrameError } =
    useFrameImport();
  const { pick: pickImage, importing: importingSticker, error: stickerError, clearError: clearStickerError } =
    useImageImport();

  const [activeTool, setActiveTool] = useState<ToolId>('frame');
  const [customFrames, setCustomFrames] = useState<Frame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState(DEFAULT_FRAME_ID);
  const [aspect, setAspect] = useState(DEFAULT_WORKSPACE.ratio);
  const [stageSize, setStageSize] = useState<Size>({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState(false);
  const livePath = useSharedValue('');
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [drawingFlags, setDrawingFlags] = useState({ hidden: false, locked: false });
  const [imageFlags, setImageFlags] = useState({ hidden: false, locked: true });
  const [frameFlags, setFrameFlags] = useState({ hidden: false, locked: false });
  const [brushColor, setBrushColor] = useState(STICKER_COLORS[1]);
  const [brushWidth, setBrushWidth] = useState(8);
  const [brushErase, setBrushErase] = useState(false);
  const [stickerColor, setStickerColor] = useState(STICKER_COLORS[0]);
  const [colorTarget, setColorTarget] = useState<ColorTarget | null>(null);

  const doc = useMemo<EditorDoc>(
    () => ({
      overlays: layers.overlays,
      strokes: layers.strokes,
      filter: layers.filter,
      frameId: selectedFrameId,
      aspect,
    }),
    [layers.overlays, layers.strokes, layers.filter, selectedFrameId, aspect],
  );
  const restoreDoc = useCallback(
    (d: EditorDoc) => {
      layers.restore({ overlays: d.overlays, strokes: d.strokes, filter: d.filter });
      setSelectedFrameId(d.frameId);
      setAspect(d.aspect);
    },
    [layers],
  );
  const { undo, redo, canUndo, canRedo } = useEditorHistory(doc, restoreDoc);

  const allFrames = useMemo(() => [...FRAMES, ...customFrames], [customFrames]);
  const frameSource = useMemo(() => {
    const f = allFrames.find(x => x.id === selectedFrameId);
    return f?.source ?? f?.imageUrl;
  }, [allFrames, selectedFrameId]);

  const canvasSize = useMemo<Size>(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) return { width: 0, height: 0 };
    const r = fitAspect(
      { width: stageSize.width - spacing.lg * 2, height: stageSize.height - spacing.lg * 2 },
      aspect,
    );
    return { width: r.width, height: r.height };
  }, [stageSize, aspect]);
  const imageRect = useMemo(() => getFittedRect(canvasSize), [getFittedRect, canvasSize]);
  const centre = useMemo(
    () => ({ x: canvasSize.width / 2, y: canvasSize.height / 2 }),
    [canvasSize],
  );

  const brush = useMemo(
    () => ({ color: brushColor, width: brushWidth, erase: brushErase }),
    [brushColor, brushWidth, brushErase],
  );
  const onDrawStart = useCallback(() => setDrawing(true), []);
  const onDrawEnd = useCallback(() => setDrawing(false), []);

  const canvasGesture = useCanvasInteraction({
    tool: activeTool,
    layers,
    imageGestures,
    brush,
    hasSelection: !!layers.selectedOverlay,
    livePath,
    onDrawStart,
    onDrawEnd,
    onEditText: () => setTextModalOpen(true),
  });

  const onStageLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // Lock the canvas box once measured. The bottom sheet keeps a fixed
    // height, so the only real reason to re-measure is an orientation change
    // (width changes) — never a tool switch.
    setStageSize(prev =>
      prev.width === width && prev.height > 0 ? prev : { width, height },
    );
  }, []);

  useEffect(() => {
    const msg = frameError ?? stickerError;
    if (msg) {
      Alert.alert('Import failed', msg, [
        { text: 'OK', onPress: () => { clearFrameError(); clearStickerError(); } },
      ]);
    }
  }, [frameError, stickerError, clearFrameError, clearStickerError]);

  const onSelectTool = useCallback(
    (tool: ToolId) => {
      layers.select(null);
      setActiveTool(tool);
      setSheetOpen(true);
      if (tool === 'text') setTextModalOpen(true);
    },
    [layers],
  );

  // Re-open the sheet whenever an overlay becomes selected (style panel).
  useEffect(() => {
    if (layers.selectedId) setSheetOpen(true);
  }, [layers.selectedId]);

  const onImportFrame = useCallback(async () => {
    const frame = await importFrame();
    if (frame) {
      setCustomFrames(prev => [...prev, frame]);
      setSelectedFrameId(frame.id);
    }
  }, [importFrame]);

  const onImportSticker = useCallback(async () => {
    const uri = await pickImage();
    if (uri) layers.addStickerImage(uri, centre);
  }, [pickImage, layers, centre]);

  const onSubmitText = useCallback(
    (text: string) => {
      setTextModalOpen(false);
      const editing = layers.selectedOverlay;
      if (editing && editing.kind === 'text') {
        const halfWidth = measureTextHalfWidth(
          text,
          editing.fontSize,
          editing.familyId,
          editing.styleId,
        );
        layers.updateText(editing.id, { text, halfWidth });
      } else {
        const halfWidth = measureTextHalfWidth(
          text,
          DEFAULT_TEXT_SIZE,
          DEFAULT_FAMILY_ID,
          DEFAULT_STYLE_ID,
        );
        layers.addText(
          {
            text,
            color: '#FFFFFF',
            fontSize: DEFAULT_TEXT_SIZE,
            halfWidth,
            familyId: DEFAULT_FAMILY_ID,
            styleId: DEFAULT_STYLE_ID,
          },
          centre,
        );
      }
    },
    [layers, centre],
  );

  const onCancelText = useCallback(() => setTextModalOpen(false), []);

  const onOverlayFamily = useCallback(
    (familyId: string) => {
      const o = layers.selectedOverlay;
      if (o?.kind !== 'text') return;
      layers.updateText(o.id, {
        familyId,
        halfWidth: measureTextHalfWidth(o.text, o.fontSize, familyId, o.styleId),
      });
    },
    [layers],
  );
  const onOverlayStyle = useCallback(
    (styleId: string) => {
      const o = layers.selectedOverlay;
      if (o?.kind !== 'text') return;
      layers.updateText(o.id, {
        styleId,
        halfWidth: measureTextHalfWidth(o.text, o.fontSize, o.familyId, styleId),
      });
    },
    [layers],
  );

  const currentColor = useMemo(() => {
    if (colorTarget === 'sticker') return stickerColor;
    if (colorTarget === 'draw') return brushColor;
    if (colorTarget === 'overlay') return layers.selectedOverlay?.color ?? '#FFFFFF';
    return '#FFFFFF';
  }, [colorTarget, stickerColor, brushColor, layers.selectedOverlay]);

  const onColorSubmit = useCallback(
    (hex: string) => {
      if (colorTarget === 'sticker') setStickerColor(hex);
      else if (colorTarget === 'draw') setBrushColor(hex);
      else if (colorTarget === 'overlay') layers.updateSelected({ color: hex });
      setColorTarget(null);
    },
    [colorTarget, layers],
  );

  const exportArgs = useCallback(async () => {
    layers.select(null);
    await new Promise<void>(resolve => setTimeout(() => resolve(), 60));
    return {
      canvasRef,
      captureRect: { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height },
      format: 'png' as const,
    };
  }, [layers, canvasRef, canvasSize]);

  const onSave = useCallback(async () => {
    if (!skImage || canvasSize.width <= 0) return;
    try {
      const result = await save(await exportArgs());
      Alert.alert('Saved', `Image saved to Photos (${result.width}×${result.height}).`);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'The image could not be saved.');
    }
  }, [save, exportArgs, skImage, canvasSize.width]);

  const onShare = useCallback(async () => {
    if (!skImage || canvasSize.width <= 0) return;
    try {
      await share(await exportArgs());
    } catch (e) {
      Alert.alert('Share failed', e instanceof Error ? e.message : 'The image could not be shared.');
    }
  }, [share, exportArgs, skImage, canvasSize.width]);

  const onResetAll = useCallback(() => {
    imageGestures.reset();
    layers.restore({ overlays: [], strokes: [], filter: 'none' });
    setSelectedFrameId(DEFAULT_FRAME_ID);
    setAspect(DEFAULT_WORKSPACE.ratio);
    setActiveTool('frame');
    setBrushErase(false);
    setSheetOpen(true);
  }, [imageGestures, layers]);

  const onSetRatio = useCallback(
    (r: number) => setAspect(clamp(r, MIN_RATIO, MAX_RATIO)),
    [],
  );
  const onNudgeRatio = useCallback(
    (dir: 1 | -1) =>
      setAspect(a => clamp(a * (dir > 0 ? RATIO_STEP : 1 / RATIO_STEP), MIN_RATIO, MAX_RATIO)),
    [],
  );

  const canvasReady = canvasSize.width > 0 && !!skImage;
  const sel = layers.selectedOverlay;
  const selected = sel && !sel.hidden && !sel.locked ? sel : null;
  const visibleOverlays = useMemo(
    () => layers.overlays.filter(o => !o.hidden),
    [layers.overlays],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <EditorHeader
        onClose={navigation.goBack}
        onSave={onSave}
        onShare={onShare}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        busy={exporting}
        actionsDisabled={!canvasReady}
      />

      <View style={styles.stage} onLayout={onStageLayout}>
        {error ? (
          <View style={styles.centre}>
            <Text style={styles.errorText}>{error}</Text>
            <Button label="Go back" variant="secondary" onPress={navigation.goBack} />
          </View>
        ) : loading || canvasSize.width <= 0 ? (
          <LoadingView message="Preparing image…" />
        ) : (
          <View style={{ width: canvasSize.width, height: canvasSize.height }}>
            <GestureDetector gesture={canvasGesture}>
              <EditorCanvas
                canvasRef={canvasRef}
                size={canvasSize}
                image={imageFlags.hidden ? null : skImage}
                imageRect={imageRect}
                transform={imageGestures.transform}
                frameSource={frameFlags.hidden ? undefined : frameSource}
                filterMatrix={filterMatrix(layers.filter)}
                overlays={visibleOverlays}
                strokes={drawingFlags.hidden ? NO_STROKES : layers.strokes}
                livePath={livePath}
                liveStroke={brush}
                liveActive={drawing && !drawingFlags.hidden}
              />
            </GestureDetector>
            {selected ? (
              <SelectionGizmo
                overlay={selected}
                onDelete={layers.removeSelected}
                onTransform={layers.moveSelected}
              />
            ) : null}
            {activeTool !== 'draw' && !selected ? (
              <ZoomControls
                onZoomIn={() => imageGestures.zoomBy(ZOOM_STEP)}
                onZoomOut={() => imageGestures.zoomBy(1 / ZOOM_STEP)}
              />
            ) : null}
          </View>
        )}

        {canvasReady && !layersOpen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Layers"
            onPress={() => setLayersOpen(true)}
            style={styles.layersFab}
          >
            <Icon name="layers" size={20} color={colors.text} />
          </Pressable>
        ) : null}

        {layersOpen ? (
          <LayersPanel
            onClose={() => setLayersOpen(false)}
            layers={layers}
            image={image}
            frameSource={frameSource}
            selectedId={layers.selectedId}
            drawing={drawingFlags}
            imageFlags={imageFlags}
            frameFlags={frameFlags}
            onToggleDrawing={k => setDrawingFlags(f => ({ ...f, [k]: !f[k] }))}
            onToggleImage={k => setImageFlags(f => ({ ...f, [k]: !f[k] }))}
            onToggleFrame={k => setFrameFlags(f => ({ ...f, [k]: !f[k] }))}
            onSelectOverlay={id => layers.select(id)}
          />
        ) : null}
      </View>

      <BottomSheet
        title={panelTitle(activeTool, selected)}
        contentKey={selected ? `sel-${selected.kind}` : activeTool}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      >
        {selected ? (
          <OverlayControls
            overlay={selected}
            onFamily={onOverlayFamily}
            onStyle={onOverlayStyle}
            onColor={c => layers.updateSelected({ color: c })}
            onCustomColor={() => setColorTarget('overlay')}
          />
        ) : activeTool === 'text' ? (
          <TextToolPanel onAdd={() => setTextModalOpen(true)} />
        ) : activeTool === 'size' ? (
          <WorkspacePanel
            ratio={aspect}
            onRatio={onSetRatio}
            onNudge={onNudgeRatio}
            onCustom={() => setSizeModalOpen(true)}
          />
        ) : activeTool === 'filter' ? (
          <FilterStrip value={layers.filter} onChange={layers.setFilter} image={skImage} />
        ) : activeTool === 'sticker' ? (
          <StickerTray
            color={stickerColor}
            onColor={setStickerColor}
            onCustomColor={() => setColorTarget('sticker')}
            onPick={id => layers.addSticker(id, stickerColor, centre)}
            onImport={onImportSticker}
            importing={importingSticker}
          />
        ) : activeTool === 'draw' ? (
          <DrawControls
            color={brushColor}
            size={brushWidth}
            erase={brushErase}
            onColor={setBrushColor}
            onCustomColor={() => setColorTarget('draw')}
            onSize={setBrushWidth}
            onToggleErase={setBrushErase}
            onUndo={layers.undoStroke}
            onClear={layers.clearStrokes}
            canUndo={layers.strokes.length > 0}
          />
        ) : (
          <FrameSelector
            frames={allFrames}
            selectedId={selectedFrameId}
            onSelect={setSelectedFrameId}
            onImport={onImportFrame}
            importing={importingFrame}
          />
        )}
      </BottomSheet>

      <View style={[styles.toolbarWrap, { paddingBottom: insets.bottom + spacing.xs }]}>
        <EditorToolbar
          activeTool={activeTool}
          onSelectTool={onSelectTool}
          onReset={onResetAll}
          resetDisabled={!canvasReady}
        />
      </View>

      <TextEditorModal
        visible={textModalOpen}
        initialText={selected?.kind === 'text' ? selected.text : ''}
        onCancel={onCancelText}
        onSubmit={onSubmitText}
      />

      <ColorPicker
        visible={colorTarget !== null}
        value={currentColor}
        onCancel={() => setColorTarget(null)}
        onSubmit={onColorSubmit}
      />

      <CustomSizeModal
        visible={sizeModalOpen}
        ratio={aspect}
        onCancel={() => setSizeModalOpen(false)}
        onSubmit={r => {
          onSetRatio(r);
          setSizeModalOpen(false);
        }}
      />

      {exporting ? <LoadingView overlay message="Exporting…" /> : null}
    </View>
  );
}

function panelTitle(tool: ToolId, selected: Overlay | null): string {
  if (selected) return selected.kind === 'text' ? 'Text style' : 'Sticker';
  switch (tool) {
    case 'size':
      return 'Workspace size';
    case 'filter':
      return 'Filter';
    case 'sticker':
      return 'Sticker';
    case 'draw':
      return 'Draw';
    case 'text':
      return 'Text';
    default:
      return 'Frame';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbarWrap: { backgroundColor: colors.surface },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  layersFab: {
    position: 'absolute',
    right: 0,
    top: spacing.xl,
    width: 44,
    height: 44,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  errorText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
