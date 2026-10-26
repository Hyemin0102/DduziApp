/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// Firebase 네이티브 앱이 최대한 일찍 초기화/등록되도록 진입점에서 명시적으로 import
import '@react-native-firebase/app';
import React, {useEffect, useRef, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, AppState, Platform, Linking, DeviceEventEmitter} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import DeviceInfo from 'react-native-device-info';
import Navigator from './src/screens/Navigator/Navigator';
import AuthProvider from './src/contexts/AuthContext';
import {ZoomOverlayProvider} from './src/components/common/ZoomOverlay';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {trackAppOpened, trackEvent} from './src/lib/mixpanel';
import {initAds} from './src/lib/adsInit';
import UpdateModal from './src/components/modal/UpdateModal';
import {
  subscribeToNotificationOpenedApp,
  getInitialNotificationData,
  subscribeToForegroundMessage,
} from './src/lib/notifications';
import {navigateFromNotificationData} from './src/lib/navigationRef';
import InAppNotificationBanner from './src/components/common/InAppNotificationBanner';
import {
  compareVersions,
  fetchAppVersionConfig,
  fetchIosAppStoreId,
  STORE_URLS,
} from './src/lib/appVersion';
import SupportPromptModal from './src/components/common/SupportPromptModal';
import {getSupportModalStage, recordSupportModalShown} from './src/lib/supportModal';
import {supabase} from './src/lib/supabase';

const ANDROID_PACKAGE_ID = 'com.dduziapp';

// 카메라 촬영, 사진 선택, OAuth 로그인 등은 앱을 잠깐 background로 보냈다가
// 곧바로 돌아오는데, 이런 짧은 왕복은 "진짜 재방문"이 아니므로 카운트에서 제외
const MIN_BACKGROUND_MS_TO_COUNT_AS_REOPEN = 5000;

type SectionProps = PropsWithChildren<{
  title: string;
}>;

type hide = (config?: {fade?: boolean}) => Promise<void>;

function App(): React.JSX.Element {
  useEffect(() => {
    initAds().finally(async () => {
      await BootSplash.hide({fade: true});
    });
  }, []);

  const [updateState, setUpdateState] = useState<{
    visible: boolean;
    forced: boolean;
    releaseNotes: string | null;
  } | null>(null);

  useEffect(() => {
    const checkForUpdate = async () => {
      const config = await fetchAppVersionConfig();
      if (!config) return;

      const currentVersion = DeviceInfo.getVersion();
      const isBelowMin =
        compareVersions(currentVersion, config.min_supported_version) < 0;
      const isBelowLatest =
        compareVersions(currentVersion, config.latest_version) < 0;

      // 강제 업데이트(min_supported_version 미만)는 항상 뜨고, 그 외 안내 모달은
      // show_update_modal을 켜둔 릴리즈에서만 뜸 (릴리즈마다 자동으로 뜨지 않음).
      // "다음에 하기"로 닫아도 기억해두지 않음 — 앱을 재시작하면 업데이트할 때까지 다시 뜸
      if (!isBelowMin && (!config.show_update_modal || !isBelowLatest)) return;

      setUpdateState({
        visible: true,
        forced: isBelowMin,
        releaseNotes: config.release_notes,
      });
      trackEvent('update_modal_shown', {forced: isBelowMin});
    };

    checkForUpdate();
  }, []);

  const handleUpdatePress = async () => {
    trackEvent('update_modal_update_clicked', {forced: updateState?.forced});
    if (Platform.OS === 'ios') {
      const appStoreId = await fetchIosAppStoreId();
      if (appStoreId) Linking.openURL(STORE_URLS.ios(appStoreId));
    } else {
      Linking.openURL(STORE_URLS.android(ANDROID_PACKAGE_ID)).catch(() =>
        Linking.openURL(STORE_URLS.androidWeb(ANDROID_PACKAGE_ID)),
      );
    }
  };

  const handleUpdateModalClose = () => {
    trackEvent('update_modal_dismissed', {forced: updateState?.forced});
    setUpdateState(prev => (prev ? {...prev, visible: false} : prev));
  };

  const backgroundedAtRef = useRef<number | null>(null);

  // 알림을 탭해서 앱을 열었을 때 관련 화면으로 이동 — 콜드 스타트(완전 종료 상태에서
  // 탭으로 실행)와 백그라운드 상태에서 탭한 경우 둘 다 처리
  useEffect(() => {
    getInitialNotificationData().then(data => {
      if (data) navigateFromNotificationData(data);
    });

    const unsubscribe = subscribeToNotificationOpenedApp(data => {
      navigateFromNotificationData(data);
    });

    return unsubscribe;
  }, []);

  // 앱이 포그라운드일 때 도착한 알림은 OS가 자동으로 배너를 안 띄워주므로,
  // 인앱 배너(InAppNotificationBanner)에 전달할 이벤트를 쏴줌
  useEffect(() => {
    const unsubscribe = subscribeToForegroundMessage(notification => {
      DeviceEventEmitter.emit('inAppNotification', notification);
    });
    return unsubscribe;
  }, []);

  // 응원 유도 모달 — 앱 실행 조건은 최초 마운트 시 1회 체크하고, 게시물/프로젝트를
  // 만든 "그 자리"에서 바로 뜨게 하려면 해당 화면에서 'checkSupportModal' 이벤트를
  // 쏘면 됨(화면이 어디든 전역에서 처리). 전역에 둔 이유는 Home.tsx가 아닌 다른
  // 화면(게시물/프로젝트 작성 완료 시점)에서도 같은 모달을 띄워야 하기 때문
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const [supportPromptStage, setSupportPromptStage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const checkSupportModal = async () => {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return;
      const stage = await getSupportModalStage(user.id);
      if (!stage) return;
      await recordSupportModalShown(user.id, stage);
      setSupportPromptStage(stage);
      setShowSupportPrompt(true);
    };

    checkSupportModal();

    const checkSub = DeviceEventEmitter.addListener(
      'checkSupportModal',
      checkSupportModal,
    );
    // 홈의 __DEV__ 전용 테스트 버튼이 실제 조건 체크를 건너뛰고 특정 단계를 강제로
    // 띄워보기 위해 쏘는 이벤트(디자인 확인용, 실제 노출 로직과 무관)
    const forceSub = DeviceEventEmitter.addListener(
      'forceShowSupportModal',
      (data: {stage: 1 | 2 | 3}) => {
        setSupportPromptStage(data.stage);
        setShowSupportPrompt(true);
      },
    );
    return () => {
      checkSub.remove();
      forceSub.remove();
    };
  }, []);

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
          <SupportPromptModal
            visible={showSupportPrompt}
            onClose={() => setShowSupportPrompt(false)}
            stage={supportPromptStage}
          />
        </AuthProvider>
        <InAppNotificationBanner />
      </SafeAreaProvider>
      </KeyboardProvider>
      {updateState && (
        <UpdateModal
          visible={updateState.visible}
          forced={updateState.forced}
          releaseNotes={updateState.releaseNotes}
          onUpdate={handleUpdatePress}
          onClose={handleUpdateModalClose}
        />
      )}
    </GestureHandlerRootView>
  );
}

export default App;
