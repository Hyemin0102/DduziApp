import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '@/@types/navigation';
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

export function navigateFromNotificationData(data?: Record<string, string>) {
  if (!data || Object.keys(data).length === 0) return;

  if (!navigationRef.isReady()) {
    pendingNotificationData = data;
    return;
  }

  if (data.noticeId) {
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
