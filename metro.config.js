const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Location Tracker App with Expo
 * https://docs.expo.dev/guides/customizing-metro/
 */
const config = getDefaultConfig(__dirname);

// Add any custom transformers or settings here if needed
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
