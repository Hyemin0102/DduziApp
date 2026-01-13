import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp, NavigatorScreenParams} from '@react-navigation/native';
import {
  ROOT_ROUTES,
  TAB_ROUTES,
  HOME_ROUTES,
  DISCOVER_ROUTES,
  POST_ROUTES,
  MY_PAGE_ROUTES,
  AUTH_ROUTES,
} from '../constants/navigation.constant';

// ============= Stack ParamLists =============

// Root Stack
export type RootStackParamList = {
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList>;
  [ROOT_ROUTES.PROFILE]: undefined;
  [ROOT_ROUTES.TAB_NAVIGATOR]: NavigatorScreenParams<TabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  [AUTH_ROUTES.LOGIN]: undefined;
};

// Tab Navigator
export type TabParamList = {
  [TAB_ROUTES.HOME_TAB]: NavigatorScreenParams<HomeStackParamList>;
  [TAB_ROUTES.DISCOVER_TAB]: NavigatorScreenParams<DiscoverStackParamList>;
  [TAB_ROUTES.POST_TAB]: NavigatorScreenParams<PostsStackParamList>;
  [TAB_ROUTES.MY_PAGE_TAB]: NavigatorScreenParams<MyPageStackParamList>;
};

// Home Stack
export type HomeStackParamList = {
  [HOME_ROUTES.HOME_MAIN]: undefined;
  [HOME_ROUTES.POST_DETAIL]: {postId: string};
};

// Discover Stack
export type DiscoverStackParamList = {
  [DISCOVER_ROUTES.DISCOVER_MAIN]: undefined;
  [DISCOVER_ROUTES.POST_DETAIL]: {postId: string};
};

// Posts Stack
export type PostsStackParamList = {
  [POST_ROUTES.POSTS_MAIN]: undefined;
  [POST_ROUTES.CREATE_POST]: undefined;
  [POST_ROUTES.POST_DETAIL]: {postId: string};
};

// MyPage Stack
export type MyPageStackParamList = {
  [MY_PAGE_ROUTES.MY_PAGE_MAIN]: undefined;
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
};

// ============= Navigation Props =============

// Root Stack Navigation (최상위 - 모든 화면에 접근 가능)
export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

// Auth Stack Navigation
export type AuthStackNavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

// Tab Navigation Props
export type HomeStackNavigationProp =
  NativeStackNavigationProp<HomeStackParamList>;

export type DiscoverStackNavigationProp =
  NativeStackNavigationProp<DiscoverStackParamList>;

export type PostsStackNavigationProp =
  NativeStackNavigationProp<PostsStackParamList>;

export type MyPageStackNavigationProp =
  NativeStackNavigationProp<MyPageStackParamList>;

// ============= Global Navigation Declaration =============
// React Navigation 타입 자동 완성을 위한 글로벌 선언
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
