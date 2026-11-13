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
  EXPLORE_ROUTES,
  DRAWER_ROUTES,
} from '../constants/navigation.constant';

// ============= Stack ParamLists =============

// Root Stack
export type RootStackParamList = {
  [ROOT_ROUTES.ONBOARDING]: undefined;
  [ROOT_ROUTES.AUTH]: NavigatorScreenParams<AuthStackParamList>;
  [ROOT_ROUTES.TERMS_AGREEMENT]: undefined;
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
  [TAB_ROUTES.EXPLORE_TAB]: NavigatorScreenParams<ExploreStackParamList>;
  [TAB_ROUTES.POST_TAB]: NavigatorScreenParams<PostsStackParamList>;
  [TAB_ROUTES.PROJECTS_TAB]: NavigatorScreenParams<ProjectsStackParamList>;
  [TAB_ROUTES.DRAWER_TAB]: NavigatorScreenParams<DrawerStackParamList>;
  [TAB_ROUTES.MY_PAGE_TAB]: NavigatorScreenParams<MyPageStackParamList>;
  [TAB_ROUTES.POST_CREATE_TAB]: NavigatorScreenParams<PostsStackParamList>;
  PostCreatePlaceholder: undefined;
};

// Projects Stack
export type ProjectsStackParamList = DrawerItemStackParamList & {
  [PROJECTS_ROUTES.PROJECTS_MAIN]:
    | {initialTab?: 'inProgress' | 'completed' | 'saved'}
    | undefined;
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
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl?: string; pdfPath?: string; title?: string};
  [POST_ROUTES.POST_DETAIL]: {postId: string};
  [POST_ROUTES.POSTS_MAIN]: {userId?: string} | undefined;
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
};

// Home Stack
export type HomeStackParamList = DrawerItemStackParamList & {
  [HOME_ROUTES.HOME_MAIN]: undefined;
  [POST_ROUTES.POST_DETAIL]: {postId: string};
  [POST_ROUTES.POSTS_MAIN]: {userId?: string} | undefined;
  [HOME_ROUTES.SEARCH]: undefined;
  [HOME_ROUTES.NOTIFICATIONS]: undefined;
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
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
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl?: string; pdfPath?: string; title?: string};
};

// 서랍장 실/바늘 화면 — 서랍장 탭뿐 아니라 프로젝트 상세가 있는 스택(프로젝트/홈/게시물)에도 등록됨
export type DrawerItemStackParamList = {
  // linkProjectId: 프로젝트 상세에서 "서랍에 새로 추가"로 들어온 경우 — 저장 시 그 프로젝트에 연결하고 프로젝트로 돌아감
  [DRAWER_ROUTES.YARN_RAVELRY_SEARCH]: {linkProjectId?: string} | undefined;
  // yarnId가 있으면 수정, 없으면 새로 추가 (prefill: 레이블리에서 자동으로 채운 값)
  [DRAWER_ROUTES.YARN_FORM]:
    | {
        yarnId?: string;
        prefill?: import('../lib/ravelryYarn').YarnFormValues;
        linkProjectId?: string;
        fromRavelrySearch?: boolean;
        // 색상 선택 화면에서 고른 값 (at: 같은 값을 다시 골라도 반영되도록 하는 시각)
        pickedColor?: {value: string; at: number};
      }
    | undefined;
  // Ravelry 컬러웨이 선택 — formKey: 결과를 돌려줄 실 폼 화면의 route key
  [DRAWER_ROUTES.YARN_COLORWAY]: {ravelryYarnId: number; yarnName?: string; selected?: string; formKey: string};
  [DRAWER_ROUTES.YARN_DETAIL]: {yarnId: string};
  // needleId가 있으면 수정, 없으면 새로 추가
  [DRAWER_ROUTES.NEEDLE_FORM]: {needleId?: string; linkProjectId?: string} | undefined;
  [DRAWER_ROUTES.NEEDLE_DETAIL]: {needleId: string};
};

// Drawer(서랍장) Stack
export type DrawerStackParamList = DrawerItemStackParamList & {
  [DRAWER_ROUTES.DRAWER_MAIN]: undefined;
  [PROJECTS_ROUTES.PROJECT_DETAIL]: {
    projectId?: string;
    projectTitle?: string;
    mode?: 'view' | 'edit' | 'create';
  };
};

// Explore Stack
export type ExploreStackParamList = {
  [EXPLORE_ROUTES.EXPLORE_MAIN]: {initialQuery?: string} | undefined;
  [EXPLORE_ROUTES.PATTERN_DETAIL]: {patternId: number | string; patternName?: string};
  [EXPLORE_ROUTES.PATTERN_NOTES]: {notes: string; patternName?: string};
};

// Posts Stack
export type PostsStackParamList = DrawerItemStackParamList & {
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
  [PROJECTS_ROUTES.PDF_VIEWER]: {pdfUrl?: string; pdfPath?: string; title?: string};
};

// MyPage Stack
export type MyPageStackParamList = {
  [MY_PAGE_ROUTES.MY_PAGE_MAIN]: undefined;
  [MY_PAGE_ROUTES.PROFILE_EDIT]: undefined;
  [MY_PAGE_ROUTES.SETTINGS]: undefined;
  [MY_PAGE_ROUTES.TERMS_OF_SERVICE]: undefined;
  [MY_PAGE_ROUTES.PRIVACY_POLICY]: undefined;
  [MY_PAGE_ROUTES.NOTICE_LIST]: undefined;
  [MY_PAGE_ROUTES.NOTICE_DETAIL]: {noticeId: string; title?: string};
  [MY_PAGE_ROUTES.FEEDBACK]: undefined;
  [MY_PAGE_ROUTES.LIKED_POSTS]: undefined;
  [MY_PAGE_ROUTES.MY_COMMENTS]: undefined;
  [MY_PAGE_ROUTES.SUPPORT_STATUS]: undefined;
  [POST_ROUTES.POST_DETAIL]: {postId: string};
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
