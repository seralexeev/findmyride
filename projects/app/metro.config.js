// @ts-check

const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const tsconfig = require('./tsconfig.json');
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = mergeConfig(getDefaultConfig(__dirname), {
    transformer: {
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    watchFolders: [path.resolve(__dirname, '../..')],
    resolver: {
        useWatchman: false,
        unstable_enableSymlinks: true,
        unstable_enablePackageExports: true,
        unstable_conditionNames: ['browser', 'require'],
        assetExts: assetExts.filter((ext) => ext !== 'svg'),
        sourceExts: [...sourceExts, 'svg'],
    },
});
