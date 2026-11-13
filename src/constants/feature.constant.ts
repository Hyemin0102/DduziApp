// 앱 전역 기능 플래그. 완성됐지만 이번 배포에는 안 내보내는 기능을 숨길 때 사용.
// (주석처리/삭제 대신 플래그로 숨기면 계속 타입체크/린트 대상에 남아서 재오픈 시 안전함)

// 레이블리 도안 탐색 탭. 재오픈 시점 미정 — 다시 켤 땐 이 값만 true로.
export const PATTERN_SEARCH_TAB_ENABLED = false;

// 서랍장(실/바늘) 탭. 개발 중 — ravelry-yarn-search/ravelry-yarn-detail Edge Function이
// prod에 배포되기 전까지는 스토어 빌드에서 false로 둘 것 (supabase/PENDING_PROD_DEPLOY.md 2번 참고)
export const DRAWER_TAB_ENABLED = true;
