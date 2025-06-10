export const ROOT_ROUTES = {
  /** 미인증 */
  NON_AUTH: 'nonAuth',
  /** 메인 */
  MAIN: 'main',
  /** 공통 */
  COMMON: 'common',
  /** AUTH_SHARED */
  AUTH_SHARED: 'authShared',
  /** AUTH_AFFILIATE */
  USER_COMPLETE_JOIN: 'userCompleteJoin',
  /** 마이페이지 */
  MY_PAGE: 'mypage',
} as const;

/** 탭 라우트 */
export const MAIN_ROUTES = {
  /** 홈 */
  HOME: 'main/home',
  /** 탐색 */
  DISCOVER: 'main/discover',
  /** 제휴거래소 */
  AFFILIATE: 'tab/affiliated',
  /** 마이 페이지 */
  MY_PAGE: 'tab/my_page',
  /** 인증된 유저 공유 페이지 */
  SHARED: 'tab/shared',
} as const;
