module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?@react-native|react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|@shopify/react-native-skia|react-native-safe-area-context|react-native-screens|react-native-image-picker|@react-native-camera-roll|react-native-blob-util|react-native-svg|react-native-share)/',
  ],
};
