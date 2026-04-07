import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {
  ROOT_ROUTES,
  TAB_ROUTES,
  HOME_ROUTES,
  POST_ROUTES,
  MY_PAGE_ROUTES,
  AUTH_ROUTES,
  PROJECTS_ROUTES,
} from '../constants/navigation.constant';

// ============= Stack ParamLists =============

// Root Stack
export type RootStackParamList = {
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList>;
  [ROOT_ROUTES.PROFILE]: undefined;
  [ROOT_ROUTES.TAB_NAVIGATOR]: NavigatorScreenParams<TabParamList>;
  PostCreate: undefined;
  CreatePostForProject: {projectId?: string; projectTitle?: string} | undefined;
};

// Auth Stack
export type AuthStackParamList = {
  [AUTH_ROUTES.LOGIN]: undefined;
};

// Tab Navigator
export type TabParamList = {
  [TAB_ROUTES.HOME_TAB]: NavigatorScreenParams<HomeStackParamList>;
  [TAB_ROUTES.POST_TAB]: NavigatorScreenParams<PostsStackParamList>;
  [TAB_ROUTES.PROJECTS_TAB]: NavigatorScreenParams<ProjectsStackParamList>;
  [TAB_ROUTES.MY_PAGE_TAB]: NavigatorScreenParams<MyPageStackParamList>;
  [TAB_ROUTES.POST_CREATE_TAB]: NavigatorScreenParams<PostsStackParamList>;
  PostCreatePlaceholder: undefined;
};

// Projects Stack
export type ProjectsStackParamList = {
  [PROJECTS_ROUTES.PROJECTS_MAIN]: undefined;
  [PROJECTS_ROUTES.PROJECT_DETAIL]: {
    projectId?: string;
    projectTitle?: string;
    mode?: 'view' | 'edit' | 'create';
  };
  [POST_ROUTES.CREATE_POST_FOR_PROJECT]: {
    mode?: 'create' | 'edit';
    projectId?: string;
    projectTitle?: string;
    postId?: string;
    content?: string;
    existingImages?: {
      id: string;
      image_url: string;
      display_order: number;
    }[];
  } | undefined;
  [PROJECTS_ROUTES.PROJECT_LOGS_ALL]: {projectId: string; projectTitle?: string};
  [PROJECTS_ROUTES.PROJECT_POSTS_ALL]: {projectId: string; projectTitle?: string};
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl: string; title?: string};
  [POST_ROUTES.POST_DETAIL]: {postId: string};
};

// Home Stack
export type HomeStackParamList = {
  [HOME_ROUTES.HOME_MAIN]: undefined;
  [POST_ROUTES.POST_DETAIL]: {postId: string};
  [POST_ROUTES.POSTS_MAIN]: {userId?: string} | undefined;
  [HOME_ROUTES.SEARCH]: undefined;
  [PROJECTS_ROUTES.PROJECT_DETAIL]: {
    projectId?: string;
    projectTitle?: string;
    mode?: 'view' | 'edit' | 'create';
  };
  [PROJECTS_ROUTES.PROJECT_LOGS_ALL]: {projectId: string; projectTitle?: string};
  [PROJECTS_ROUTES.PROJECT_POSTS_ALL]: {projectId: string; projectTitle?: string};
  [POST_ROUTES.CREATE_POST_FOR_PROJECT]: {
    mode?: 'create' | 'edit';
    projectId?: string;
    projectTitle?: string;
    postId?: string;
    content?: string;
    existingImages?: {
      id: string;
      image_url: string;
      display_order: number;
    }[];
  } | undefined;
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl: string; title?: string};
};

// Posts Stack
export type PostsStackParamList = {
  [POST_ROUTES.POSTS_MAIN]: {userId?: string} | undefined;
  [POST_ROUTES.POST_DETAIL]: {postId: string};
  [PROJECTS_ROUTES.PROJECT_DETAIL]: {
    projectId?: string;
    projectTitle?: string;
    mode?: 'view' | 'edit' | 'create';
  };
  [POST_ROUTES.CREATE_POST_FOR_PROJECT]: {
    mode?: 'create' | 'edit';
    projectId?: string;
    projectTitle?: string;
    postId?: string;
    content?: string;
    existingImages?: {
      id: string;
      image_url: string;
      display_order: number;
    }[];
  };
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
  [PROJECTS_ROUTES.PROJECT_LOGS_ALL]: {projectId: string; projectTitle?: string};
  [PROJECTS_ROUTES.PROJECT_POSTS_ALL]: {projectId: string; projectTitle?: string};
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl: string; title?: string};
};

// MyPage Stack
export type MyPageStackParamList = {
  [MY_PAGE_ROUTES.MY_PAGE_MAIN]: undefined;
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
  [MY_PAGE_ROUTES.SETTINGS]: undefined;
  [MY_PAGE_ROUTES.INQUIRY]: undefined;
  [MY_PAGE_ROUTES.TERMS_OF_SERVICE]: undefined;
  [MY_PAGE_ROUTES.PRIVACY_POLICY]: undefined;
};

// ============= Navigation Props =============

// Root Stack Navigation Prop (다른 스택 간 이동에 사용)
export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

// ============= Global Navigation Declaration =============
// React Navigation 타입 자동 완성을 위한 글로벌 선언
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
