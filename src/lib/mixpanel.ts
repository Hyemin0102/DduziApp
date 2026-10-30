import {AppState} from 'react-native';
import {Mixpanel} from 'mixpanel-react-native';
import Config from 'react-native-config';

const TRACK_AUTOMATIC_EVENTS = false;

export const mixpanel = new Mixpanel(Config.MIXPANEL_TOKEN!, TRACK_AUTOMATIC_EVENTS);
mixpanel.init();

export const trackEvent = (name: string, properties?: Record<string, unknown>) => {
  mixpanel.track(name, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  mixpanel.identify(userId);
  if (properties) mixpanel.getPeople().set(properties);
};

export const resetUser = () => {
  mixpanel.reset();
};

// 화면 진입마다 이벤트를 쏘면 이벤트 수가 너무 많아져서(무료플랜 월 3.5K 한도),
// 세션 동안 화면별 방문 횟수만 메모리에 쌓아두고 앱이 백그라운드로 갈 때
// 한 번에 flush — home_feed_scroll_depth가 쓰던 것과 같은 패턴
let screenViewCounts: Record<string, number> = {};

export const trackScreenView = (screenName: string) => {
  screenViewCounts[screenName] = (screenViewCounts[screenName] ?? 0) + 1;
};

const flushScreenViewSummary = () => {
  if (Object.keys(screenViewCounts).length > 0) {
    trackEvent('screen_view_summary', {counts: screenViewCounts});
    screenViewCounts = {};
  }
};

AppState.addEventListener('change', nextState => {
  if (nextState === 'background') {
    flushScreenViewSummary();
  }
});

export const trackAppOpened = () => {
  trackEvent('app_opened');
};
