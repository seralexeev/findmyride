module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: ['./babel-plugin', '@babel/plugin-transform-export-namespace-from', 'react-native-reanimated/plugin'],
};
