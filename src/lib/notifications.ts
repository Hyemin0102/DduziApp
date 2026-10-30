import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  onMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {supabase} from '@/lib/supabase';

// 모듈 로드 시점(파일 import 시점)에 바로 생성하면 Firebase 네이티브 앱이 아직
// 초기화되기 전이라 "No Firebase App '[DEFAULT]' has been created" 에러가 날 수 있어서,
// 실제로 쓰이는 시점(함수 호출 시)에 지연 생성함
function getMessagingInstance() {
  return getMessaging();
}

export async function requestNotificationPermission(): Promise<boolean> {
  // Android는 RNFB messaging의 requestPermission()이 실제 OS 권한 요청 없이
  // 항상 허용된 것처럼 응답하는 빈 스텁이라(Android 네이티브 구현 확인함),
  // POST_NOTIFICATIONS는 RN 자체 PermissionsAndroid로 따로 요청해야 함
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const authStatus = await requestPermission(getMessagingInstance());
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

// userId 파라미터는 호출부 하위호환을 위해 남겨두지만 실제로는 안 씀 — 토큰
// 소유자는 claim_device_token 안에서 auth.uid()로 서버가 직접 판별함(RLS 우회).
// 같은 기기를 다른 계정이 로그인하면(로그아웃 후 재로그인) 토큰 소유권이 그 계정으로
// 강제 재할당되어야 하는데, 클라이언트가 직접 upsert하면 RLS(user_id = auth.uid())가
// "이미 다른 계정 소유인 토큰 행"의 재할당을 막아서 조용히 실패하는 버그가 있었음.
export async function registerDeviceToken(userId: string): Promise<void> {
  try {
    const token = await getToken(getMessagingInstance());
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const {error} = await supabase.rpc('claim_device_token', {
      p_token: token,
      p_platform: platform,
    });
    if (error) throw error;
  } catch (error) {
    console.error('디바이스 토큰 등록 실패:', error);
  }
}

// 토큰이 갱신될 때(앱 재설치, 만료 등) 최신 토큰으로 다시 등록
export function subscribeToTokenRefresh(userId: string): () => void {
  return onTokenRefresh(getMessagingInstance(), async token => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await supabase.rpc('claim_device_token', {p_token: token, p_platform: platform});
  });
}

// 앱이 백그라운드에 있다가 알림을 탭해서 포그라운드로 돌아왔을 때
export function subscribeToNotificationOpenedApp(
  onOpen: (data: Record<string, string>) => void,
): () => void {
  return onNotificationOpenedApp(getMessagingInstance(), remoteMessage => {
    if (remoteMessage.data) {
      onOpen(remoteMessage.data as Record<string, string>);
    }
  });
}

// 앱이 완전히 종료된 상태에서 알림을 탭해 실행(콜드 스타트)됐는지 확인
export async function getInitialNotificationData(): Promise<
  Record<string, string> | undefined
> {
  const remoteMessage = await getInitialNotification(getMessagingInstance());
  return remoteMessage?.data as Record<string, string> | undefined;
}

export interface ForegroundNotification {
  title: string;
  body: string;
  data: Record<string, string>;
}

// 앱이 포그라운드(켜져있는 상태)일 때 알림이 오면 OS가 배너를 안 띄워주므로,
// 인앱 배너를 직접 띄우기 위해 수신 이벤트를 구독함
export function subscribeToForegroundMessage(
  onReceive: (notification: ForegroundNotification) => void,
): () => void {
  return onMessage(getMessagingInstance(), remoteMessage => {
    onReceive({
      title: remoteMessage.notification?.title ?? '',
      body: remoteMessage.notification?.body ?? '',
      data: (remoteMessage.data as Record<string, string>) ?? {},
    });
  });
}
