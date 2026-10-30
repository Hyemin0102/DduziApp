-- 신고(게시물/댓글) 처리 시 어떤 프로젝트에서 발생했는지 바로 알 수 있도록
-- project_id/project_title을 reports에 스냅샷으로 추가 (프로젝트 제목이 나중에
-- 바뀌거나 삭제돼도 신고 당시 제목이 남도록 comment_id의 reported_content_snapshot과
-- 동일한 방식)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS project_title text;
