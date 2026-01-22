// ============= Root Routes (최상위 네비게이터) =============
export const ROOT_ROUTES = {
  AUTH: 'Auth',
  PROFILE: 'Profile',
  TAB_NAVIGATOR: 'TabNavigator',
} as const;

// ============= Auth Stack Routes =============
export const AUTH_ROUTES = {
  LOGIN: 'Login',
} as const;

// ============= Tab Routes (탭 네비게이터) =============
export const TAB_ROUTES = {
  HOME_TAB: 'HomeTab',
  POST_CREATE_TAB: 'PostCreateTap',
  POST_TAB: 'PostTab',
  MY_PAGE_TAB: 'MyPageTab',
} as const;

// ============= Home Stack Routes =============
export const HOME_ROUTES = {
  HOME_MAIN: 'HomeMain',
  POST_DETAIL: 'PostDetail',
  CREATE_POST: 'CreatePost',
  SEARCH: 'Search',
} as const;

// ============= Posts Stack Routes =============
export const POST_ROUTES = {
  POSTS_MAIN: 'PostsMain',
  CREATE_POST: 'CreatePost',
  POST_DETAIL: 'PostDetail',
} as const;

// ============= MyPage Stack Routes =============
export const MY_PAGE_ROUTES = {
  MY_PAGE_MAIN: 'MyPageMain',
  PROFILE_EDIT: 'ProfileEdit',
} as const;
