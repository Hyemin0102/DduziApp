-- 피드백 기능을 mailto 방식으로 전환하면서 더 이상 쓰지 않는 inquiries 테이블 제거
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- (기존 데이터를 보존하고 싶다면 실행 전에 select * from inquiries로 백업할 것)

DROP TABLE IF EXISTS public.inquiries;
