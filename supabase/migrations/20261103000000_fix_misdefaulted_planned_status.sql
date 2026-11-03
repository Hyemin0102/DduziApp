-- 버그: projects.status 컬럼이 prod에 추가된 시점(20261005060000, 10/27 적용)과
-- 이 필드를 아는 첫 클라이언트(1.0.7)가 실제로 스토어에 풀린 시점(11/2~3) 사이에
-- 공백이 있었음. 그 사이 구버전 앱으로 생성된 프로젝트는 status를 전혀 안 보내서
-- 컬럼 DEFAULT('planned')가 그대로 들어갔는데, started_at은 구버전 앱이 정상적으로
-- 오늘 날짜를 채워 보냈음 — "시작일은 있는데 상태는 예정"인 모순된 행이 생김.
--
-- 진짜 "예정"(아직 시작 안 함) 프로젝트는 설계상 started_at이 항상 null이므로,
-- status='planned'인데 started_at이 있는 행만 골라서 원래 마이그레이션의 백필
-- 로직(완료 여부 기준)과 동일하게 바로잡음.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

UPDATE public.projects
SET status = CASE WHEN is_completed THEN 'completed' ELSE 'in_progress' END
WHERE status = 'planned' AND started_at IS NOT NULL;
