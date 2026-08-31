-- get_most_saved_projects가 SECURITY DEFINER로 바뀌어 실시간 호출로 전환되면서
-- 더 이상 아무도 읽지 않는 캐시 테이블 제거
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

DROP TABLE IF EXISTS public.most_saved_projects;
