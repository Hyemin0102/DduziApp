-- 공지사항 테이블: 콘텐츠는 개발자가 Supabase 대시보드에서 직접 등록 (별도 관리자 UI 없음)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 공지사항은 비공개 정보가 아니므로 누구나 읽을 수 있음. 쓰기 정책은 만들지 않음
-- (등록/수정/삭제는 service role로 대시보드에서만 수행)
CREATE POLICY "Anyone can view notices" ON public.notices
FOR SELECT TO public
USING (true);
