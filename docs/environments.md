# Dev / Prod 환경 구성

이 프로젝트는 dev와 prod, 두 개의 완전히 분리된 백엔드(Supabase 프로젝트)를 쓰고, 클라이언트(React Native 앱)는 빌드 시점에 어느 쪽을 바라볼지 환경변수로 결정한다. Firebase(푸시 알림)는 두 환경이 **공유**하고, 앱 번들 ID/패키지명도 환경 구분 없이 **동일**하다 — 이 두 가지는 자주 헷갈리는 지점이라 먼저 명시해둔다.

## 전체 그림

| 구성요소 | dev | prod |
|---|---|---|
| Supabase 프로젝트 | `aaeqoryqxtkcovplmpyx` (dduzi) | `xjqrqnlhejslenaagnel` (dduzi_prod) |
| Firebase/FCM | 공유 (같은 프로젝트) | 공유 (같은 프로젝트) |
| Android `applicationId` | `com.dduziapp` (동일) | `com.dduziapp` (동일) |
| iOS `PRODUCT_BUNDLE_IDENTIFIER` | `com.dduzi.app` (동일) | `com.dduzi.app` (동일) |

**번들 ID가 같다는 것의 의미**: dev 빌드와 prod 빌드를 같은 기기에 동시에 설치해둘 수 없다. 실기기에서 전환하려면 다시 빌드해서 덮어 설치해야 한다.

**Firebase가 공유라는 것의 의미**: 푸시 알림(FCM)은 dev/prod 구분 없이 같은 Firebase 프로젝트를 쓴다. `android/app/google-services.json`, `ios/dduziApp/GoogleService-Info.plist`는 각각 파일이 하나씩만 있고 환경별로 안 갈린다. 환경이 갈리는 건 어디까지나 **Supabase(DB/Auth/Storage/Edge Functions)** 쪽이다.

## 환경변수 파일 (`.env`, `.env.development`, `.env.production`)

루트에 세 파일이 있고 전부 `.gitignore`에 등록돼 있어 **git에는 안 올라간다** — 새 컴퓨터에서 클론하면 이 세 파일을 직접 만들어야 한다(기존 팀원에게 공유받거나, 비밀번호 관리 도구에서 복사).

필요한 키(값은 비밀이라 여기엔 안 적음):

```
APP_NAME=
KAKAO_SDK=
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
NAVER_SCHEME=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
RN_SUPABASE_URL=
RN_SUPABASE_ANON_KEY=
MIXPANEL_TOKEN=
```

세 파일 다 키 목록은 동일하고, `RN_SUPABASE_URL`/`RN_SUPABASE_ANON_KEY`만 dev/prod Supabase 프로젝트에 맞게 값이 다르다. 코드에서는 `react-native-config`의 `Config.RN_SUPABASE_URL` 식으로 읽는다(`src/lib/supabase.ts` 참고).

- `.env` — 어떤 접미사도 안 붙은 `yarn android`/`yarn ios`를 실행할 때 쓰이는 기본값. 보통 dev 값과 동일하게 맞춰둔다.
- `.env.development` — dev 전용
- `.env.production` — prod 전용

## 실행 방법

`package.json`에 환경별 스크립트가 이미 정의돼 있다:

```sh
yarn android:dev    # ENVFILE=.env.development
yarn android:prod   # ENVFILE=.env.production
yarn ios:dev        # ENVFILE=.env.development
yarn ios:prod       # ENVFILE=.env.production
```

`ENVFILE` 환경변수를 CLI가 읽어서, Android는 `android/app/build.gradle`의 `dotenv.gradle`(react-native-config)이, iOS는 React Native 빌드 스크립트(`with-environment.sh`)가 해당 `.env.*` 파일을 읽어 빌드에 주입한다. 별도의 Gradle productFlavor나 Xcode Configuration을 쓰는 게 아니라, **순전히 `ENVFILE` 값 하나로 갈리는 구조**다.

### iOS에서 Xcode GUI로 직접 빌드할 때

터미널 없이 Xcode에서 Run 버튼으로 돌릴 경우, 스킴(Scheme)에 `ENVFILE`이 하드코딩돼 있다:

- `dduziApp` 스킴 → `ENVFILE=.env.development`
- `dduziApp-prod` 스킴 → `ENVFILE=.env.production`

둘 다 `ios/dduziApp.xcodeproj/xcshareddata/xcschemes/`에 있는 **공유(shared) 스킴**이라 git에 커밋돼 있고, 새 컴퓨터에서 clone하면 Xcode 상단 스킴 선택 드롭다운에 둘 다 자동으로 보인다. (만약 안 보이면 `Product → Scheme → Manage Schemes`에서 "Shared" 체크박스가 켜져 있는지 확인 — 꺼진 채로 만든 스킴은 `xcuserdata`에 들어가서 그 사람 컴퓨터에만 존재하고 git에 안 올라간다.)

## Supabase 프로젝트 자체 다루기 (CLI)

```sh
supabase projects list
```

로 확인 가능. 이 레포는 기본적으로 dev(`aaeqoryqxtkcovplmpyx`)에 **linked**돼 있어서, `--project-ref`를 안 붙이면 dev를 대상으로 동작한다. prod를 대상으로 하려면 항상 명시적으로 붙여야 한다:

```sh
supabase functions deploy <함수명>                              # → dev
supabase functions deploy <함수명> --project-ref xjqrqnlhejslenaagnel   # → prod
```

## DB 마이그레이션: dev에서 검증 후 prod 반영

**이 프로젝트는 `supabase db push` CLI 마이그레이션을 안 쓴다.** `supabase/migrations/*.sql` 파일은 SQL 원본을 기록해두는 용도고, 실제 적용은 각 프로젝트의 **Supabase Studio → SQL Editor**에 수동으로 붙여넣어 실행하는 방식이다.

흐름:

1. 새 기능 개발 시 `supabase/migrations/`에 날짜순 파일명(`YYYYMMDDHHMMSS_설명.sql`)으로 SQL 작성
2. **dev** Studio SQL Editor(`aaeqoryqxtkcovplmpyx`)에 붙여넣어 실행, 거기서 충분히 테스트
3. 바로 prod에 올리지 않고, 다른 작업들과 묶어서 한 번에 반영할 경우 `supabase/PENDING_PROD_DEPLOY.md`에 "아직 prod에 안 올라간 항목"으로 기록해둠
4. 반영 시점이 되면 **prod** Studio SQL Editor(`xjqrqnlhejslenaagnel`)에 **같은 SQL**을 붙여넣어 실행
5. 반영 완료된 항목은 `PENDING_PROD_DEPLOY.md`에서 지움

prod에 SQL을 올릴 때는 **이미 스토어에 배포된 구버전 앱과의 하위호환**을 꼭 확인해야 한다 — 스키마만 먼저 prod에 올라가고 그 스키마를 아는 새 클라이언트는 아직 심사 중/미배포인 경우가 흔해서, 구버전 클라이언트가 보내는 요청(예: 새 컬럼 없이 INSERT)이 깨지지 않는지가 핵심 체크포인트다.

## Edge Function 배포: dev에서 검증 후 prod 반영

```sh
supabase functions deploy <함수명>                                            # dev에 배포
# dev에서 동작 확인 후
supabase functions deploy <함수명> --project-ref xjqrqnlhejslenaagnel         # prod에 배포
```

일부 함수(`apple-server-notifications`, `google-voided-purchases-sync` 등)는 외부 서비스(Apple/Google)가 로그인 토큰 없이 직접 호출하는 웹훅이라 `--no-verify-jwt` 플래그를 꼭 붙여야 한다(안 붙이면 게이트웨이 단계에서 401로 막힘). 이 플래그는 **배포할 때마다 매번** 붙여야 하며, `supabase/config.toml`에 `[functions.함수명]` / `verify_jwt = false`로 등록해두면 플래그 없이 `supabase functions deploy`만 해도 영구적으로 적용된다(이 레포에선 `apple-server-notifications`, `send-push-fcm`이 이렇게 등록돼 있음).

**배포 후 반드시 `supabase functions list --project-ref <ref>`로 실제 배포됐는지 재확인할 것** — "배포했다"고 기억하는 것과 실제로 그 프로젝트에 배포된 건 별개다. 이 프로젝트에서 dev에만 배포하고 prod 배포를 깜빡한 채 "완료"로 기록해버린 사고가 실제로 있었다.

## 정리: 새 기능을 prod까지 내보내는 전체 순서

1. 코드/SQL/Edge Function 전부 **dev** 환경(`ENVFILE=.env.development` 또는 `yarn *:dev`)에서 개발 및 테스트
2. DB 변경은 dev Studio에서 먼저 실행, Edge Function은 `--project-ref` 없이(dev) 먼저 배포
3. 기능이 충분히 검증되면 같은 SQL/함수를 **prod**(`xjqrqnlhejslenaagnel`)에 반영 — Studio SQL Editor + `--project-ref xjqrqnlhejslenaagnel`
4. 클라이언트 테스트는 `yarn android:prod` / `yarn ios:prod`(또는 Xcode `dduziApp-prod` 스킴)로 prod 백엔드에 붙여서 최종 확인
5. 스토어 제출용 빌드(Archive/`bundleRelease`)는 **항상 prod** 환경변수여야 함 — `ENVFILE=.env.production`
