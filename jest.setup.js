/**
 * Jest setup: mock the native rendering/gesture/animation libraries so component
 * trees can be rendered under node without the native runtime.
 */
require('react-native-gesture-handler/jestSetup');

// Minimal Reanimated mock covering the APIs the app uses. Avoids pulling in
// react-native-worklets' native module, which cannot load under jest.
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const identity = (value) => value;
  const noopAnimation = (toValue) => toValue;
  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (factory) => {
      try {
        return factory();
      } catch {
        return {};
      }
    },
    useDerivedValue: (factory) => ({ value: factory() }),
    withTiming: noopAnimation,
    withSpring: noopAnimation,
    withRepeat: identity,
    withDelay: (_delay, animation) => animation,
    withSequence: (...animations) => animations[animations.length - 1],
    cancelAnimation: () => undefined,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    Easing: new Proxy({}, { get: () => () => 0 }),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveAsset: jest.fn(async () => ({ node: {} })),
    save: jest.fn(async () => 'file://saved.png'),
  },
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = (props) => React.createElement(View, props, props.children);
  return new Proxy(
    { __esModule: true, default: Passthrough },
    { get: (t, k) => (k in t ? t[k] : Passthrough) },
  );
});

jest.mock('react-native-share', () => ({ __esModule: true, default: { open: jest.fn(async () => ({})) } }));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/tmp', DocumentDir: '/docs' },
      writeFile: jest.fn(async () => undefined),
      unlink: jest.fn(async () => undefined),
    },
  },
}));

// Lightweight Skia mock: every export renders/returns a harmless passthrough.
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = (props) => React.createElement(View, props, props.children);
  const helpers = {
    __esModule: true,
    vec: (x = 0, y = 0) => ({ x, y }),
    rect: (x = 0, y = 0, width = 0, height = 0) => ({ x, y, width, height }),
    rrect: (r, rx = 0, ry = 0) => ({ rect: r, rx, ry }),
    Skia: {},
    ImageFormat: { PNG: 'png', JPEG: 'jpeg', WEBP: 'webp' },
    useImage: () => null,
    useFont: () => null,
    useCanvasRef: () => ({ current: null }),
    useCanvas: () => null,
  };
  return new Proxy(helpers, {
    get: (target, key) => (key in target ? target[key] : Passthrough),
  });
});
