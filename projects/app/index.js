import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import { name } from './app.json';
import { App } from './src/App';

AppRegistry.registerComponent(name, () => App);
