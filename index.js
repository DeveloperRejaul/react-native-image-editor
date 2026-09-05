/**
 * @format
 */

// Must be the first import so gesture handler wires into the native view hierarchy.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
