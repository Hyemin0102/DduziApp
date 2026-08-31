-- 트렌드 키워드 배치 결과를 바로 노출하지 않고, 관리자가 검토 후 승인해야 화면에 반영되도록
-- pending(초안) 테이블 분리. compute-trending-keywords 배치는 이제 이 테이블만 갈아끼우고,
-- 앱이 실제로 읽는 public.trending_keywords는 손대지 않음.
--
-- 승인 방법: pending 테이블 내용을 대시보드 Table Editor에서 검토한 뒤, 아래 SQL로 반영
--   TRUNCATE public.trending_keywords;
--   INSERT INTO public.trending_keywords (rank, keyword, project_count)
--   SELECT rank, keyword, project_count FROM public.trending_keywords_pending;
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.trending_keywords_pending (
  rank integer PRIMARY KEY,
  keyword text NOT NULL,
  project_count integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trending_keywords_pending ENABLE ROW LEVEL SECURITY;

-- 관리자 검토용이라 클라이언트(anon/authenticated)에는 공개하지 않음 —
-- service_role(배치, 대시보드)만 접근 가능하도록 별도 정책 없이 둠
