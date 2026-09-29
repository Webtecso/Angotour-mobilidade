module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // 'react-native-worklets/plugin' (usado pelo Reanimated 4) deve ser
    // sempre o ÚLTIMO plugin desta lista.
    plugins: ['react-native-worklets/plugin'],
  };
};
