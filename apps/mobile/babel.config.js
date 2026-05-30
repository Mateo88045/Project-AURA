module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
      'nativewind/babel',
    ],
    // Reanimated 4 moved its babel plugin into react-native-worklets.
    // This MUST remain the last plugin — it transforms `worklet` directives.
    plugins: ['react-native-worklets/plugin'],
  };
};
