import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp} from '@react-navigation/native';

// ============= Stack ParamLists =============

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Profile: undefined;
  TabNavigator: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

// Tab Navigator
export type TabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  PostTab: undefined;
  MyPageTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  // 추가 예정: PostDetail, Bookmark 등
};

// Discover Stack
export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  // 추가 예정: PostDetail 등
};

// Posts Stack
export type PostsStackParamList = {
  PostsMain: undefined;
};

// MyPage Stack
export type MyPageStackParamList = {
  MyPageMain: undefined;
  ProfileEdit: undefined;
};

// ============= Navigation Props =============

// Root Stack Navigation
export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

// Auth Stack Navigation
export type AuthStackNavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

// Combined Stack + Tab Navigation (각 탭의 스택에서 사용)
export type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export type MyPageScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MyPageStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export type DiscoverScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export type PostsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PostsStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

// ============= Global Navigation Declaration =============
// React Navigation 타입 자동 완성을 위한 글로벌 선언
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
