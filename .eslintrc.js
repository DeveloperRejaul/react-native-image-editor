module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js', 'jest.config.js', 'metro.config.js', 'babel.config.js'],
      env: { node: true, jest: true },
    },
  ],
};
