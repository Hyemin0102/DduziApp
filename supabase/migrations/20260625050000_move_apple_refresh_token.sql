-- users 테이블의 "Anyone can view users" (SELECT true) 정책 때문에 apple_refresh_token이
-- anon key만으로 통째로 조회 가능했음. nickname/profile_image/bio는 공개 embed 구조상 막을 수
-- 없어서, 가장 위험한 apple_refresh_token만 service_role 전용 별도 테이블로 분리함.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  apple_refresh_token text
);

ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;
-- 정책을 하나도 만들지 않음 → anon/authenticated는 전혀 접근 불가, service_role만 RLS 우회로 접근

INSERT INTO public.user_secrets (user_id, apple_refresh_token)
SELECT id, apple_refresh_token FROM public.users WHERE apple_refresh_token IS NOT NULL;

ALTER TABLE public.users DROP COLUMN IF EXISTS apple_refresh_token;
