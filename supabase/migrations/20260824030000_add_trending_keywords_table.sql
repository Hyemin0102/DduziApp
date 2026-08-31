-- 검색 화면 "지금 많이 뜨고 있어요" 태그용 캐시 테이블
-- 매일 1회 compute-trending-keywords Edge Function이 계산해서 top5를 통째로 갈아끼움
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.trending_keywords (
  rank integer PRIMARY KEY,
  keyword text NOT NULL,
  project_count integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trending_keywords ENABLE ROW LEVEL SECURITY;

-- 트렌드 태그는 비공개 정보가 아니므로 누구나 읽을 수 있음.
-- 쓰기는 Edge Function이 service role로만 수행 (별도 정책 없음)
CREATE POLICY "Anyone can view trending keywords" ON public.trending_keywords
FOR SELECT TO public
USING (true);
