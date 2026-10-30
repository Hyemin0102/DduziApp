# Prod 배포 대기 목록

dev에서 개발/검증이 끝났지만, 다른 대규모 기능 개발까지 다 끝난 뒤 한 번에 prod에 반영하기로 한 항목들. 처리 완료된 항목은 이 파일에서 제거할 것.

---

## 완료됨 (2026-10-27 prod 적용)

- 인앱 피드백 / 알림 인프라(공지·저장프로젝트 푸시) / 좋아요·댓글(신고 자동숨김, 작성자 스냅샷, 속도 제한) / 프로젝트 "예정" 상태 / 앱 후원 테이블·트리거
- 앱 후원 **결제 검증/환불** 전체: `verify-supporter-purchase`, `apple-server-notifications`(`--no-verify-jwt`), `google-voided-purchases-sync`(`--no-verify-jwt`, cron 하루 1회) 배포 완료. Apple/Google IAP 시크릿 전부 등록, App Store Connect 웹훅 URL 등록 완료.
  - **주의**: `google-voided-purchases-sync`는 원래 게이트웨이 JWT 검증에만 의존했는데, Supabase 신규 포맷 시크릿 키(`sb_secret_...`)가 JWT가 아니라 게이트웨이 검증을 통과 못 하는 문제가 있어서 `send-push-fcm`과 동일한 `x-internal-secret` 자체 검증 방식으로 코드 수정함(2026-10-27).
  - `sync_project_status_fields()` 트리거는 신규 앱 출시 전까지 구버전 앱(`is_completed`만 전송)과도 호환되도록 양방향 동기화로 수정해서 적용함(dev도 동일 패치).

**클라이언트 코드 변경사항**(DB와 무관, 다음 앱스토어 빌드에 포함 필요 — 아직 미반영):
- 위 기능들에 대응하는 모든 UI/로직(좋아요/댓글 UI, 알림 센터, 응원 모달/결제 플로우, 뜨개 상태 세그먼트 등)
- Search.tsx "뜨개함에 많이 저장됐어요" → "최근 뜨개함에 저장됐어요" 라벨 수정

---

## 1. 10/27~10/29 추가 수정사항 (dev 적용, prod 미반영)

- `20261027000000_fix_device_token_reassign_rls.sql` — 같은 기기에서 계정 전환 시 FCM 토큰이 이전 계정 소유로 고정되던 버그 수정(`claim_device_token` RPC 추가, `src/lib/notifications.ts`도 이 RPC를 쓰도록 변경됨 — 클라이언트 코드도 같이 배포 필요)
- `20261027010000_add_per_post_comment_rate_limit.sql` — 댓글 속도 제한: 전체 합산 1시간 30개→80개, 게시물 하나당 1시간 30개 신규 추가
- `20261027020000_restrict_comments_on_private_posts.sql` — 비공개 게시물은 글쓴이 포함 전원 좋아요/댓글 작성 불가, 댓글 조회도 글쓴이만 가능, 알림도 억제(클라이언트 `src/screens/PostDetail/PostDetailScreen.tsx`/`src/components/common/PostCommentsSheet.tsx`의 `canWriteComment` 처리도 같이 배포 필요)
- `20261027030000_backfill_private_project_likes_comments_off.sql` — 기존 비공개 프로젝트의 `likes_enabled`/`comments_enabled`를 false로 백필(공개 프로젝트는 안 건드림)
- `20261029000000_bidirectional_block_visibility.sql` — 차단을 양방향으로 변경(게시물/프로젝트/뜨개로그/게시물이미지 RLS + 좋아요·댓글 검증 트리거). **dev 테스트 완료(2026-10-29)**

**클라이언트 코드**(DB와 무관, 다음 앱스토어 빌드에 포함 필요):
- 비공개 게시물 좋아요/댓글 버튼 비활성화·흐림 처리(`PostDetailScreen.tsx`)
- 프로젝트 상세: 게시물 공개 기본값 변경, 비공개 전환 시 좋아요/댓글 토글 자동 off, 예정 상태일 때 게시물/로그 추가 버튼 비활성화 + 토스트(`ProjectDetailScreen.tsx`)
- 디바이스 토큰 재등록 로직 변경(`src/lib/notifications.ts`)

---

## 2. 레이블리 도안 탐색 / 뜨개위시(일부) — ⚠️ 계속 보류

**아직 prod 배포 대상 아님.** 도안탐색 탭 재오픈 시점 미정.
클라이언트는 `PATTERN_SEARCH_TAB_ENABLED` 플래그로 탭을 숨겨뒀지만, 아래 Edge Function들은
dev에만 배포돼 있고 prod에는 배포하면 안 됨 — 재오픈하기로 결정될 때 이 섹션째로 적용할 것.

- **신규 DB 마이그레이션 없음** — 이 기능은 전부 Ravelry REST API를 그대로 프록시하는 Edge Function 기반이라 Supabase 테이블/RPC를 전혀 건드리지 않음.
- **Edge Function** (prod 미배포, 전부 신규 배포 또는 재배포 필요):
  - `ravelry-search` (기존 함수 수정됨)
  - `ravelry-pattern-detail` (신규)
  - `ravelry-pattern-categories` (신규)
  - `ravelry-yarn-detail` (신규)
  - **주의**: 네 함수 모두 `RAVELRY_USERNAME`/`RAVELRY_PASSWORD`(Ravelry API Basic Auth 자격증명) 환경변수가 필요함 — prod 프로젝트에 이 시크릿이 아직 없다면 배포 전에 Supabase Dashboard에서 설정할 것.
- **클라이언트 코드**: `ExploreScreen`/`FilterSheet`/`PatternDetailScreen`/`PatternNotesScreen` 등 탐색 탭 전체(도안 검색/필터/정렬/무한스크롤/상세), 하단 탭 구조 변경 포함 — 전부 DB 변경과 무관하게 앱스토어 배포만으로 반영됨.
- 뜨개위시(위시리스트) 기능 자체는 [[project_knit_wishlist_plan]] 메모 기준 아직 스키마 설계 전 단계 — 별도 마이그레이션이 추가로 필요할 예정(이 목록엔 아직 없음, 구현 시작하면 추가할 것).

---

## 적용 시 체크리스트 (다음 배포용으로 남겨둠)
- [ ] 위 섹션 2(레이블리)는 건너뛸 것 — 재오픈 결정 전까지 보류
- [ ] 섹션 1의 나머지 마이그레이션(20261027000000/010000/020000/030000)도 dev 테스트 완료되면 상태 업데이트할 것
- [ ] 클라이언트 코드 변경사항(완료됨/섹션 1 참고)은 다음 앱스토어 빌드/배포에 포함
