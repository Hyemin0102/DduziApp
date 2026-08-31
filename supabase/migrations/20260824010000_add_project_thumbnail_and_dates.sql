-- 프로젝트 대표이미지 및 시작일/완료일 추가
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS started_at DATE,
  ADD COLUMN IF NOT EXISTS completed_at DATE;
