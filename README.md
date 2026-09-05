# GFL Image Editor

Mobile image editor built with React Native CLI (no Expo). Select an image, drop it on an editor
canvas, apply a frame, adjust the image beneath it (zoom / pan / rotate), and export the result.

## Status

**Working editor.** Home → image picker → editor → export/save to the gallery.

- Workspace: aspect-ratio presets (1:1, 4:5, 3:4, 9:16, 3:2, 16:9) + fine `−/+` nudge — the export takes the chosen proportions
- Base image: pinch / pan / rotate (gesture) + on-screen zoom buttons
- Frames: 5 bundled + import your own from the device
- Filters: 7 presets shown as live thumbnails of your image
- Text: type, 6 font presets, colour swatches + custom colour picker, drag / pinch / rotate, edit, delete
- Stickers: 6 vector shapes shown as previews + import your own image; colour swatches + custom colour; drag / pinch / rotate, delete
- Draw: freehand brush + eraser, size slider, colour swatches + custom colour, undo, clear
- Custom colour picker (HSV panel + hue slider) shared by text / sticker / draw
- Undo / redo across the whole edit history (header icons)
- Export: everything composited into one PNG, saved to the gallery

Chrome uses `react-native-svg` line icons.

Builds and runs on Android and iOS; the full flow is verified on the Android emulator and on a
physical device (Galaxy A52 / Android 14).

Not built yet: crop, remote/premium frames, projects/drafts, PNG/JPEG quality controls.

## Stack

React Native 0.87 · TypeScript · React Native Skia · Gesture Handler · Reanimated 4 (+ Worklets).
See [CLAUDE.md](./CLAUDE.md) for the full spec, architecture, and locked dependency versions.

## Requirements

- Node 22+
- JDK 17
- Xcode 26 + CocoaPods 1.16 (iOS)
- Android SDK (`ANDROID_HOME` set)

## Setup

```sh
npm install
cd ios && pod install && cd ..
```

## Run

```sh
npm start           # Metro bundler
npm run android     # or: npm run ios
```

## Checks

```sh
npx tsc --noEmit
npx eslint .
npm test
```

## Project layout

```
src/
├── components/      shared UI primitives
├── features/
│   ├── editor/      canvas, gestures, frame system, export (hooks + utils + screen)
│   └── home/        image picker entry point
├── navigation/
├── assets/frames/   bundled transparent PNG frames
├── constants/
├── theme/
└── App.tsx
```
