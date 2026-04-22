# DduziApp 기획서

뜨개질 프로젝트를 관리하고 공유하는 뜨개 커뮤니티 앱

---

## 1. 서비스 개요

**서비스명:** 뜨개(Dduzi)

나의 뜨개 프로젝트를 기록하고, 다른 사람의 작업을 둘러보는 SNS형 뜨개 관리 앱

### 핵심 가치

- 뜨개질 프로젝트의 진행 과정을 게시물로 기록
- 완성된 작품 또는 진행 중인 프로젝트를 공개/비공개로 관리
- 다른 사용자의 작업을 피드로 탐색

### 기술 스택

| 분류          | 기술                                        |
| ------------- | ------------------------------------------- |
| 앱 프레임워크 | React Native (TypeScript)                   |
| 스타일링      | Emotion Native (CSS-in-JS)                  |
| 네비게이션    | React Navigation (Stack + Tab)              |
| 백엔드/DB     | Supabase (PostgreSQL)                       |
| 인증          | 카카오 로그인, 구글 로그인                  |
| 이미지        | Supabase Storage, react-native-image-picker |

---

## 2. 전체 페이지 구조

### 2.1 네비게이션 계층도

```
RootStack
├─ [비로그인] AuthStack
│   └─ Login                 # 소셜 로그인 (카카오/구글/애플)
│
├─ [신규 유저] Profile         # 최초 프로필 설정
│
└─ [로그인 후] TabNavigator
    ├─ HomeTab → HomeStack
    │   ├─ Home               # 공개 피드
    │   ├─ Search             # 검색
    │   ├─ PostDetail         # 게시물 상세
    │   ├─ Posts              # 타 사용자 프로필
    │   ├─ ProjectDetail      # 프로젝트 상세
    │   └─ PostCreateForProject
    │
    ├─ PostTab → PostsStack
    │   ├─ Posts              # 내 게시물 그리드
    │   ├─ PostCreate
    │   ├─ PostDetail
    │   ├─ ProjectDetail
    │   ├─ PostCreateForProject
    │   └─ ProfileEdit
    │
    └─ MyPageTab → MyPageStack
        ├─ MyPage
        ├─ ProfileEdit
        ├─ Projects           # 내 프로젝트 목록
        ├─ ProjectDetail
        ├─ PostCreateForProject
        └─ PostDetail
```

### 2.2 라우트 상수

| 라우트 키                      | 화면             | 파일 경로                                         |
| ------------------------------ | ---------------- | ------------------------------------------------- |
| HOME_ROUTES.HOME_MAIN          | 홈 피드          | screens/Home/Home.tsx                             |
| HOME_ROUTES.SEARCH             | 검색             | screens/Search/Search.tsx                         |
| HOME_ROUTES.POST_DETAIL        | 게시물 상세      | screens/PostDetail/PostDetailScreen.tsx           |
| POSTS_ROUTES.POSTS_MAIN        | 내 뜨개 그리드   | screens/Posts/PostsScreen.tsx                     |
| PROJECTS_ROUTES.PROJECT_DETAIL | 프로젝트 상세    | screens/ProjectDetail/ProjectDetailScreen.tsx     |
| PROJECTS_ROUTES.PROJECTS_MAIN  | 프로젝트 목록    | screens/Projects/ProjectsScreen.tsx               |
| AUTH_ROUTES.LOGIN              | 로그인           | screens/Auth/Login.tsx                            |
| MYPAGE_ROUTES.MYPAGE_MAIN      | 마이페이지       | screens/MyPage/Mypage.tsx                         |
| PROFILE                        | 프로필 설정/수정 | screens/Profile/Profile.tsx                       |
| CREATE_POST_FOR_PROJECT        | 게시물 작성      | screens/PostCreate/PostCreateForProjectScreen.tsx |

---

## 3. 주요 사용자 플로우

### 3.1 인증 플로우

```
앱 실행
  ├─ [세션 있음] → 홈 탭
  └─ [세션 없음] → Login 화면
        ├─ 카카오/구글 로그인 버튼 클릭
        │     └─ SDK 토큰 → Supabase Auth → users 테이블 저장
        ├─ [신규 유저] → Profile 화면 → 저장 → 홈 탭
        └─ [기존 유저] → 홈 탭
```

### 3.2 홈 피드 플로우

```
홈 탭 진입
  └─ 공개 게시물 피드 (PostCard 목록)
        ├─ 게시물 클릭 → PostDetail
        ├─ 프로필 클릭 → Posts (타 사용자 그리드)
        └─ 검색 버튼 → Search 화면
```

### 3.3 내 뜨개 (포스트) 플로우

```
PostTab 진입
  ├─ [탭] 뜨개 중 / 뜨개 완료 필터
  ├─ 그리드 셀 클릭 → PostDetail
  └─ 게시물 추가 버튼 → PostCreateForProject
        ├─ 이미지 선택 (카메라 / 갤러리)
        ├─ 내용 입력
        ├─ 프로젝트 선택
        │     └─ "새 프로젝트 추가" → ProjectDetail (create 모드)
        │                               └─ 저장 후 복귀, 자동 선택
        └─ 저장 → 그리드로 복귀
```

### 3.4 프로젝트 플로우

```
MyPage → 내 프로젝트 → Projects 목록
  ├─ 프로젝트 카드 클릭 → ProjectDetail (view 모드)
  │     ├─ 헤더 "수정" → edit 모드
  │     │     ├─ 제목, 내용, 실/바늘/도안 정보 수정
  │     │     ├─ 공개/비공개 토글
  │     │     ├─ 완료 여부 토글
  │     │     ├─ 뜨개 로그 추가/삭제
  │     │     └─ 저장
  │     └─ 게시물 섹션 → PostDetail
  └─ "새 프로젝트" FAB → ProjectDetail (create 모드)
        ├─ 제목(필수), 내용, 실/바늘/도안 정보 입력
        ├─ 공개/비공개, 완료 여부 선택
        └─ 저장 → view 모드로 전환
```

### 3.5 검색 플로우

```
홈 헤더 검색 아이콘 → Search 화면
  ├─ 검색어 입력 (자동 포커스)
  │     └─ RPC: search_posts() 호출
  │           - 프로젝트 타이틀 매칭
  │           - 작성자 닉네임 매칭
  ├─ 검색 결과: PostCard 목록 → PostDetail
  └─ X 버튼 → 검색 초기화
```

### 3.6 게시물 상세 플로우

```
PostDetail 진입 (postId)
  ├─ 이미지 슬라이더 (가로 스크롤)
  ├─ 내용, 프로젝트명, 실/바늘/도안 정보
  ├─ 비공개 배지 (비공개 프로젝트인 경우)
  ├─ [내 게시물] 수정 / 삭제 버튼
  └─ 프로필 클릭 → Posts (작성자 페이지)
```

---

## 4. 핵심 기능 목록

### 인증

- 카카오 소셜 로그인
- 구글 소셜 로그인
- 신규 가입 시 프로필 설정 (닉네임, 프로필 이미지)
- 세션 자동 유지 (AsyncStorage)

### 피드 (홈)

- 공개 게시물 전체 피드 조회
- Pull-to-refresh
- PostCard 스켈레톤 로딩 (이미지 렌더링 완료 후 전환)

### 내 뜨개 (Posts)

- 3열 그리드로 게시물 표시
- 탭 필터: 뜨개 중 / 뜨개 완료
- 다중 이미지 게시물 표시 (layers 아이콘)
- 비공개 게시물 표시 (lock 아이콘)
- 타 사용자 페이지: 공개 게시물만 노출

### 게시물 작성/수정

- 이미지 다중 선택 (카메라 / 갤러리)
- 이미지 순서 변경, 삭제
- 텍스트 내용 입력
- 프로젝트 연결 선택 (or 새 프로젝트 생성)
- 기존 게시물 수정 (이미지 추가/삭제 포함)

### 프로젝트 관리

- 프로젝트 생성 / 수정 / 조회 (단일 화면, 모드 전환)
- 프로젝트 필드: 제목, 내용, 실 정보, 바늘 정보, 도안(텍스트+링크 혼합)
- 공개/비공개 설정
- 완료 여부 설정
- 뜨개 로그 추가/삭제
- 연결된 게시물 목록 (이미지 슬라이더 형태)
- 도안 필드에서 URL 자동 감지 → 탭 시 브라우저 열기

### 검색

- 프로젝트 타이틀로 검색
- 작성자 닉네임으로 검색

### 프로필

- 닉네임 수정
- 프로필 이미지 수정 (카메라/갤러리/기본 이미지)
- 바이오 수정

---

## 5. 화면별 기능 상세

### 5.1 Login

**목적:** 소셜 로그인으로 앱 진입

| 요소               | 설명                                             |
| ------------------ | ------------------------------------------------ |
| 카카오 로그인 버튼 | 카카오 SDK → Supabase signInWithIdToken('kakao') |
| 구글 로그인 버튼   | 구글 SDK → Supabase signInWithIdToken('google')  |
| 에러 메시지        | 로그인 실패 시 인라인 노출                       |

**분기 조건**

- 신규 유저 → Profile 화면 이동
- 기존 유저 → TabNavigator 진입

---

### 5.2 Home

**목적:** 공개 게시물 피드 탐색

| 요소             | 설명                                 |
| ---------------- | ------------------------------------ |
| PostCard 목록    | 공개 프로젝트의 모든 게시물 (최신순) |
| Pull-to-refresh  | 피드 새로고침                        |
| 스켈레톤 로딩    | 이미지 prefetch + onLoadEnd 후 해제  |
| 검색 버튼 (헤더) | Search 화면으로 이동                 |

**Supabase 쿼리**

```sql
posts
  JOIN post_images
  JOIN users
  JOIN projects!inner (visibility = 'public')
ORDER BY created_at DESC
```

---

### 5.3 Posts — 내 뜨개

**목적:** 사용자의 게시물을 그리드로 탐색

| 요소                     | 설명                                   |
| ------------------------ | -------------------------------------- |
| UserProfileCard          | 프로필 이미지, 닉네임, 바이오 + 버튼   |
| 탭 (뜨개 중 / 뜨개 완료) | 프로젝트 is_completed 기준 필터        |
| 3열 그리드               | 게시물 썸네일 + 아이콘                 |
| 다중 이미지 아이콘       | post_images.length > 1 → layers 아이콘 |
| 비공개 아이콘            | visibility === 'private' → lock 아이콘 |
| 스켈레톤                 | prefetch + onLoadEnd 기반 로딩 처리    |
| 게시물 추가 버튼         | 내 페이지에서만 노출                   |

**타인 페이지 차이점**

- projects!inner + visibility = 'public' 필터 적용
- 프로필 수정 / 게시물 추가 버튼 미노출

---

### 5.4 ProjectDetail

**목적:** 프로젝트 생성 / 수정 / 상세 조회 (단일 화면)

**모드 구분**

| 모드   | 진입 조건                    | 헤더 버튼   |
| ------ | ---------------------------- | ----------- |
| create | mode: 'create' 파라미터      | 저장        |
| view   | projectId 있음, mode 없음    | 수정        |
| edit   | view 모드에서 수정 버튼 클릭 | 저장 / 취소 |

**필드 목록**

| 필드          | DB 컬럼      | 비고                        |
| ------------- | ------------ | --------------------------- |
| 제목          | title        | 필수                        |
| 프로젝트 설명 | content      | 최소 높이, 하단 테두리      |
| 실 정보       | yarn_info    |                             |
| 바늘 정보     | needle_info  |                             |
| 도안          | pattern_info | URL 자동 감지 → 탭으로 열기 |
| 공개/비공개   | visibility   | 토글 칩                     |
| 완료 여부     | is_completed | 토글 칩                     |

**뜨개 로그**

- edit/create 모드: 로그 추가 인풋 + 추가 버튼
- view 모드: 로그 목록만 표시
- 삭제: 스와이프 또는 삭제 버튼

**게시물 섹션**

- 연결된 게시물의 첫 이미지를 가로 슬라이더로 표시
- 이미지 카운터 표시 (n/total)
- 클릭 → PostDetail 이동

---

### 5.5 PostCreateForProject

**목적:** 게시물 작성 및 수정

| 요소             | 설명                                       |
| ---------------- | ------------------------------------------ |
| 이미지 선택 영역 | 카메라 / 갤러리 선택, 다중 이미지 지원     |
| 이미지 순서/삭제 | 선택 후 재정렬 / X 버튼 삭제               |
| 텍스트 입력      | 게시물 내용                                |
| 프로젝트 선택    | 내 프로젝트 목록 피커                      |
| 새 프로젝트 추가 | 피커 하단 버튼 → ProjectDetail create 모드 |

**프로젝트 피커 동작**

- useFocusEffect로 화면 복귀 시 목록 새로고침
- 프로젝트 없을 때: "새 프로젝트 추가" 버튼만 표시
- 프로젝트 있을 때: 목록 + 구분선 + "새 프로젝트 추가" 버튼

---

### 5.6 PostDetail

**목적:** 단일 게시물 상세 조회

| 요소                  | 설명                                |
| --------------------- | ----------------------------------- |
| 이미지 슬라이더       | 가로 스크롤, 이미지 카운터          |
| 비공개 배지           | visibility === 'private' 일 때 표시 |
| 게시물 내용           | 텍스트                              |
| 프로젝트 정보         | 실 정보, 바늘 정보, 도안            |
| 작성자 프로필         | 클릭 → Posts (작성자 페이지)        |
| 액션 버튼 (내 게시물) | 수정 / 삭제                         |

---

### 5.7 Search

**목적:** 프로젝트 타이틀 / 작성자 닉네임으로 게시물 검색

| 요소            | 설명                                             |
| --------------- | ------------------------------------------------ |
| 검색 인풋       | 자동 포커스                                      |
| 검색 결과       | PostCard 목록                                    |
| 빈 상태         | "검색어를 입력해주세요" / "검색 결과가 없습니다" |
| Pull-to-refresh | 현재 쿼리 재검색                                 |

**검색 대상 (Supabase RPC search_posts)**

- projects.title ILIKE '%query%'
- users.nickname ILIKE '%query%'

---

### 5.8 Projects

**목적:** 내 프로젝트 전체 목록 관리

| 요소            | 설명                                           |
| --------------- | ---------------------------------------------- |
| 요약 카운트     | 진행 중 / 완료 개수                            |
| 프로젝트 카드   | 제목, 날짜, 상태 배지 (진행/완료, 공개/비공개) |
| 상태 점         | 진행 중: 색상 점, 완료: 체크                   |
| FAB             | 새 프로젝트 추가 → ProjectDetail create 모드   |
| Pull-to-refresh | 목록 새로고침                                  |

---

### 5.9 Profile

**목적:** 프로필 설정 (신규) 및 수정 (기존)

| 요소          | 설명                                            |
| ------------- | ----------------------------------------------- |
| 프로필 이미지 | 클릭 → 카메라 / 갤러리 선택                     |
| 기본 이미지   | 신규 가입 시 5종 중 랜덤 배정                   |
| 닉네임        | TextInput                                       |
| 바이오        | TextInput (멀티라인)                            |
| 저장 버튼     | Supabase Storage 업로드 + users 테이블 업데이트 |

---

### 5.10 MyPage

**목적:** 내 정보 허브

| 요소             | 설명                        |
| ---------------- | --------------------------- |
| 프로필 카드      | 이미지, 닉네임, 바이오      |
| 내 프로젝트 메뉴 | Projects 화면으로 이동      |
| 프로필 수정 메뉴 | Profile 수정 화면으로 이동  |
| 로그아웃         | 세션 종료 후 Login 화면으로 |

---

## 6. 데이터 모델

### DB 테이블 관계

```
users
  id, nickname, profile_image, bio, provider, created_at

projects
  id, user_id → users.id
  title, content, yarn_info, needle_info
  pattern_info (URL 혼합 텍스트)
  is_completed, visibility ('public' | 'private')
  created_at, updated_at

posts
  id, user_id → users.id, project_id → projects.id
  content, created_at, updated_at

post_images
  id, post_id → posts.id
  image_url, display_order

knitting_logs
  id, project_id → projects.id
  content, created_at
```

### 공개/비공개 처리 규칙

| 상황             | 처리 방식                                   |
| ---------------- | ------------------------------------------- |
| 홈 피드          | projects!inner + visibility = 'public' 필터 |
| 검색             | 공개 게시물만 결과에 포함                   |
| 타인 PostsScreen | projects!inner + visibility = 'public'      |
| 본인 페이지      | 공개/비공개 모두 노출                       |

---

## 7. 주요 기술 패턴

### 스켈레톤 로딩 전략

```
데이터 fetch
  → Image.prefetch (탭별)
  → FlatList 마운트
  → 각 GridCell/PostCard에서 onLoadEnd 카운팅
  → 목표 수량 도달 시 skeleton overlay 제거
```

이미지가 실제로 화면에 렌더링된 이후 스켈레톤이 사라짐

### 프로젝트 상세 인라인 수정

- useRef (handleSaveRef, handleCancelEditRef): 헤더 버튼의 stale closure 방지
- useLayoutEffect: 모드 변경 시 헤더 버튼 동적 교체
- navigation.replace: create 완료 후 view 모드로 스택 교체

### 화면 복귀 시 데이터 새로고침

- useFocusEffect + useCallback: 화면 포커스 시마다 재조회
- 게시물 작성에서 새 프로젝트 생성 후 복귀 시 자동 목록 갱신

### URL 인라인 렌더링 (도안 필드)

```typescript
const URL_REGEX = /https?:\/\/[^\s]+/g;
text.split(URL_REGEX);
// URL 세그먼트 → <S.Link onPress={() => Linking.openURL(url)} />
// 텍스트 세그먼트 → <S.InfoValue />
```
