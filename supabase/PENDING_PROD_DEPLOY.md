# Prod 배포 대기 목록

dev에서 개발/검증이 끝났지만, 다른 대규모 기능 개발까지 다 끝난 뒤 한 번에 prod에 반영하기로 한 항목들. 처리 완료된 항목은 이 파일에서 제거할 것.

---

## 완료됨 (2026-10-27~11-02 prod 적용)

- 인앱 피드백 / 알림 인프라(공지·저장프로젝트 푸시) / 좋아요·댓글(신고 자동숨김, 작성자 스냅샷, 속도 제한 상향 + 게시물별 상한 추가) / 프로젝트 "예정" 상태 / 앱 후원 테이블·트리거
- 디바이스 토큰 재할당 버그 수정(`claim_device_token` RPC)
- 비공개 게시물 좋아요/댓글 전면 차단(글쓴이 포함) + 비공개 프로젝트 백필
- 차단 양방향화(게시물/프로젝트/뜨개로그/게시물이미지 RLS + 좋아요·댓글 검증)
- 앱 후원 **결제 검증/환불** 전체: `verify-supporter-purchase`, `apple-server-notifications`(`--no-verify-jwt`), `google-voided-purchases-sync`(`--no-verify-jwt`, cron 하루 1회) 배포 완료(2026-11-02 `verify-supporter-purchase`/`apple-server-notifications`가 실제로는 dev에만 배포돼있던 걸 뒤늦게 발견해서 재배포 — 지금은 `supabase functions list`로 prod/dev 둘 다 확인 완료). Apple/Google IAP 시크릿 전부 등록, App Store Connect 웹훅 URL 등록 완료.
  - **주의**: `google-voided-purchases-sync`는 원래 게이트웨이 JWT 검증에만 의존했는데, Supabase 신규 포맷 시크릿 키(`sb_secret_...`)가 JWT가 아니라 게이트웨이 검증을 통과 못 하는 문제가 있어서 `send-push-fcm`과 동일한 `x-internal-secret` 자체 검증 방식으로 코드 수정함.
  - `sync_project_status_fields()` 트리거는 신규 앱 출시 전까지 구버전 앱(`is_completed`만 전송)과도 호환되도록 양방향 동기화로 수정해서 적용함(dev도 동일 패치).
- iOS 실제 응원 결제(TestFlight 아님, 운영 환경 로컬 빌드 + Sandbox) end-to-end 검증 완료(2026-11-02): 결제 → `verify-supporter-purchase` 검증 → `supporter_level`/`count` 반영까지 확인.

**클라이언트 코드 변경사항**(DB와 무관, 다음 앱스토어 빌드에 포함 필요 — 아직 미반영):
- 위 기능들에 대응하는 모든 UI/로직(좋아요/댓글 UI, 알림 센터, 응원 모달/결제 플로우, 뜨개 상태 세그먼트, 비공개 게시물 좋아요/댓글 비활성화 표시, 디바이스 토큰 재등록 로직 등)
- Search.tsx "뜨개함에 많이 저장됐어요" → "최근 뜨개함에 저장됐어요" 라벨 수정
- 알림 권한 거부 시 설정 동기화, 마이페이지/설정 화면 포커스마다 DB 재동기화(레이스 컨디션 방어)

---

## 0. 🚨 iOS 응원(인앱구매) 프로덕션에서 전혀 동작 안 함 (2026-11-03 발견)

`dduzi_support_single` 상품이 App Store Connect에서 **"제출 준비 중"** 상태로 멈춰있음 — 한 번도 앱 버전 제출에 첨부돼서 심사를 받은 적이 없음. Sandbox 테스트는 상품 승인 상태와 무관하게 항상 통과돼서 dev 단계에선 전혀 안 드러났고, 1.0.7이 실제로 프로덕션에 풀리고 나서야 "SKU not found"로 발견됨 — 지금 1.0.7을 쓰는 모든 실사용자가 응원하기를 눌러도 막혀있는 상태.

- [ ] 다음 iOS 버전(1.0.8) 제출 시, 버전 정보 화면의 **"앱 내 구입 및 구독"** 섹션에서 `dduzi_support_single`을 반드시 선택/첨부해서 같이 제출할 것
- [ ] 승인 후 실제 프로덕션에서 재테스트

---

## 1. 레이블리 도안 탐색 / 뜨개위시(일부) — ⚠️ 계속 보류

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

## 참고: dev에만 있고 prod에 없는 함수 중 `send-inquiry-notification`

의도적 보류가 아니라 **완전히 죽은 레거시 함수**임 — 클라이언트 어디서도 호출 안 하고, 이 함수가 쓰던 `inquiries` 테이블도 이미 삭제됨(`20260625040000_drop_inquiries_table.sql`). "피드백" 기능(`send-feedback-email`)으로 대체됨. prod에 배포할 필요 없음, dev에서도 정리 대상이면 추후 삭제 고려.

---

## 적용 시 체크리스트 (다음 배포용으로 남겨둠)
- [ ] 위 섹션 1(레이블리)은 건너뛸 것 — 재오픈 결정 전까지 보류
- [ ] 클라이언트 코드 변경사항(완료됨 섹션 참고)은 다음 앱스토어 빌드/배포에 포함
- [ ] **앞으로 "함수 배포 완료"라고 기록하기 전엔 반드시 `supabase functions list --project-ref <ref>`로 실제 배포 여부 재확인할 것** — 2026-11-02에 `verify-supporter-purchase`/`apple-server-notifications`가 "완료"로 기록됐지만 실제로는 dev에만 배포돼있던 걸 뒤늦게 발견한 사례 있음
