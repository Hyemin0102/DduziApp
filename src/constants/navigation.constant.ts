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
  SEARCH_TAB: 'SearchTab',
  POST_CREATE_TAB: 'PostCreateTap',
  POST_TAB: 'PostTab',
  PROJECTS_TAB: 'ProjectsTab',
  MY_PAGE_TAB: 'MyPageTab',
} as const;

// ============= Projects Stack Routes =============
export const PROJECTS_ROUTES = {
  PROJECTS_MAIN: 'ProjectsMain',
  PROJECT_DETAIL: 'ProjectDetail',
  CREATE_POST_FOR_PROJECT: 'CreatePostForProject',
  PROJECT_LOGS_ALL: 'ProjectLogsAll',
  PROJECT_POSTS_ALL: 'ProjectPostsAll',
} as const;

// ============= Home Stack Routes =============
export const HOME_ROUTES = {
  HOME_MAIN: 'HomeMain',
  POST_DETAIL: 'PostDetail',
  CREATE_POST: 'CreatePost',
  SEARCH: 'Search',
  POSTS_MAIN: 'PostsMain',
} as const;

// ============= Posts Stack Routes =============
export const POST_ROUTES = {
  POSTS_MAIN: 'PostsMain',
  CREATE_POST: 'CreatePost',
  POST_DETAIL: 'PostDetail',
  PROJECT_DETAIL: 'ProjectDetail',
  CREATE_POST_FOR_PROJECT: 'CreatePostForProject',
} as const;

// ============= MyPage Stack Routes =============
export const MY_PAGE_ROUTES = {
  MY_PAGE_MAIN: 'MyPageMain',
  PROFILE_EDIT: 'ProfileEdit',
  PROJECTS_MAIN: 'ProjectsMain',
  PROJECT_DETAIL: 'ProjectDetail',
  CREATE_POST_FOR_PROJECT: 'CreatePostForProject',
  SETTINGS: 'Settings',
  INQUIRY: 'Inquiry',
} as const;
