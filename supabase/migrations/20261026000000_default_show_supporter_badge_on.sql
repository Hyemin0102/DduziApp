-- 뱃지 보여주기 기본값을 false -> true로 변경. 아직 출시 전 기능이라 기존(테스트) 행도
-- 다 같이 true로 백필함(실사용자가 명시적으로 끈 값이 섞여있을 수 없는 시점이라 안전).
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.users ALTER COLUMN show_supporter_badge SET DEFAULT true;
UPDATE public.users SET show_supporter_badge = true WHERE show_supporter_badge = false;
