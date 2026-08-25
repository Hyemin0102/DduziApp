/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useRef} from 'react';
import type {PropsWithChildren} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, AppState} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import Navigator from './src/screens/Navigator/Navigator';
import AuthProvider from './src/contexts/AuthContext';
import {ZoomOverlayProvider} from './src/components/common/ZoomOverlay';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {trackAppOpened} from './src/lib/mixpanel';

// 카메라 촬영, 사진 선택, OAuth 로그인 등은 앱을 잠깐 background로 보냈다가
// 곧바로 돌아오는데, 이런 짧은 왕복은 "진짜 재방문"이 아니므로 카운트에서 제외
const MIN_BACKGROUND_MS_TO_COUNT_AS_REOPEN = 5000;

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

  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    trackAppOpened();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const backgroundedAt = backgroundedAtRef.current;
        const isGenuineReopen =
          backgroundedAt === null ||
          Date.now() - backgroundedAt >= MIN_BACKGROUND_MS_TO_COUNT_AS_REOPEN;
        if (isGenuineReopen) {
          trackAppOpened();
        }
        backgroundedAtRef.current = null;
      } else if (nextState === 'background') {
        backgroundedAtRef.current = Date.now();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: '#fff'}}>
      <StatusBar barStyle={'dark-content'} backgroundColor="#fff" />
      <KeyboardProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <ZoomOverlayProvider>
            <Navigator />
          </ZoomOverlayProvider>
        </AuthProvider>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default App;
