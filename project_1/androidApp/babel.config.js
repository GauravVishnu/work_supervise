module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Disable react-native-reanimated plugin to avoid worklets error
      // ['react-native-reanimated/plugin']
    ],
  };
};