/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import Navigator from './src/screens/Navigator/Navigator';
import AuthProvider from './src/contexts/AuthContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

type hide = (config?: {fade?: boolean}) => Promise<void>;

function App(): React.JSX.Element {
  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({fade: true});
    });
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <KeyboardProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <Navigator />
        </AuthProvider>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default App;
