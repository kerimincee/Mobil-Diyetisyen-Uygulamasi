module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      // NOTE: This plugin must be last in the list
      'react-native-reanimated/plugin',
    ],
  };
};




