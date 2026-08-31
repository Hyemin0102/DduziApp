-- 약관 동의 여부 / 프로필 설정 완료 여부를 계정(users 테이블)에 저장.
-- 기존엔 AsyncStorage에만 저장돼서 앱 재설치 시 계정은 그대로인데 로컬 플래그만 날아가
-- 기존 유저한테도 다시 약관 동의/프로필 설정을 요구하는 버그가 있었음.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- 프로필 설정: 기존 유저는 최초 가입 때 이미 통과했던 절차이므로 소급 처리
-- (버그는 "재설치 시"에만 있었지, 최초 가입 흐름 자체는 정상이었음)
UPDATE public.users
SET profile_completed_at = created_at
WHERE profile_completed_at IS NULL;

-- 약관 동의: 현재 배포 버전이 로그인 버튼 자체를 약관 체크박스로 막고 있어서
-- (지금 살아있는 세션은 전부 이 화면을 거쳐서 로그인한 것) 소급 처리
UPDATE public.users
SET terms_agreed_at = created_at
WHERE terms_agreed_at IS NULL;
