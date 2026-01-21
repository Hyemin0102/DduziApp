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
  PostCreate: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  [AUTH_ROUTES.LOGIN]: undefined;
};

// Tab Navigator
export type TabParamList = {
  [TAB_ROUTES.HOME_TAB]: NavigatorScreenParams<HomeStackParamList>;
  [TAB_ROUTES.POST_TAB]: NavigatorScreenParams<PostsStackParamList>;
  [TAB_ROUTES.MY_PAGE_TAB]: NavigatorScreenParams<MyPageStackParamList>;
  [TAB_ROUTES.POST_CREATE_TAB]: NavigatorScreenParams<PostsStackParamList>;
  PostCreatePlaceholder: undefined;
};

// Home Stack
export type HomeStackParamList = {
  [HOME_ROUTES.HOME_MAIN]: undefined;
  [HOME_ROUTES.POST_DETAIL]: {postId: string};
  [HOME_ROUTES.SEARCH]: undefined;
  [POST_ROUTES.CREATE_POST]: undefined;
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

// ============= Global Navigation Declaration =============
// React Navigation 타입 자동 완성을 위한 글로벌 선언
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}