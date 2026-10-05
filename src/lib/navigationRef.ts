import {createNavigationContainerRef} from '@react-navigation/native';
import {DeviceEventEmitter} from 'react-native';
import {RootStackParamList} from '@/@types/navigation';
import {supabase} from '@/lib/supabase';
import {
  ROOT_ROUTES,
  TAB_ROUTES,
  MY_PAGE_ROUTES,
  POST_ROUTES,
} from '@/constants/navigation.constant';

// 앱 어디서든(리스너 콜백 등 컴포넌트 트리 바깥에서도) navigate 호출할 수 있게
// 공유하는 네비게이션 ref. Navigator.tsx의 NavigationContainer에 그대로 연결됨
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// 콜드 스타트(앱이 완전히 꺼진 상태에서 알림 탭으로 실행)일 때, NavigationContainer가
// 아직 준비되기 전에 네비게이션 요청이 들어올 수 있어 대기시켜뒀다가 onReady에서 흘려보냄
let pendingNotificationData: Record<string, string> | undefined;

// 푸쉬를 탭해서 콘텐츠로 바로 딥링크되는 경로는 알림센터 화면을 거치지 않아서
// 별도로 읽음 처리를 안 해주면 계속 안읽음으로 남음. FCM data payload엔 유저별
// notifications 행의 id가 없어서(한 트리거가 여러 유저에게 같은 payload를 보내는
// 구조), user_id + noticeId/postId 조합으로 매칭해서 읽음 처리함
async function markNotificationAsRead(
  matchColumn: 'noticeId' | 'postId',
  value: string,
) {
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return;

  const {error} = await supabase
    .from('notifications')
    .update({is_read: true})
    .eq('user_id', user.id)
    .eq('is_read', false)
    .eq(`data->>${matchColumn}`, value);

  if (error) {
    console.error('푸쉬 탭 알림 읽음 처리 실패:', error);
    return;
  }
  DeviceEventEmitter.emit('notificationsUpdated');
}

export function navigateFromNotificationData(data?: Record<string, string>) {
  if (!data || Object.keys(data).length === 0) return;

  if (!navigationRef.isReady()) {
    pendingNotificationData = data;
    return;
  }

  if (data.noticeId) {
    markNotificationAsRead('noticeId', data.noticeId);
    navigationRef.navigate(ROOT_ROUTES.TAB_NAVIGATOR, {
      screen: TAB_ROUTES.MY_PAGE_TAB,
      params: {
        screen: MY_PAGE_ROUTES.NOTICE_DETAIL,
        params: {noticeId: data.noticeId},
      },
    } as never);
    return;
  }

  if (data.postId) {
    markNotificationAsRead('postId', data.postId);
    navigationRef.navigate(ROOT_ROUTES.TAB_NAVIGATOR, {
      screen: TAB_ROUTES.HOME_TAB,
      params: {
        screen: POST_ROUTES.POST_DETAIL,
        params: {postId: data.postId},
      },
    } as never);
    return;
  }
}

export function flushPendingNotificationNavigation() {
  if (pendingNotificationData) {
    const data = pendingNotificationData;
    pendingNotificationData = undefined;
    navigateFromNotificationData(data);
  }
}
