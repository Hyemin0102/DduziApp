-- 비공개 프로젝트를 공개로 전환하면 그 프로젝트의 게시물들이 홈 피드에 노출되는데,
-- created_at 기준 정렬이라 예전에 만든 프로젝트면 피드 맨 아래로 묻혀버림.
-- created_at은 실제 작성 시점 기록이라 직접 바꾸지 않고, 별도의 published_at 컬럼을 둬서
-- "공개로 전환된 시점"을 기준으로 홈 피드를 정렬하도록 함.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 기존 게시물은 일단 작성 시점과 동일하게 백필
UPDATE public.posts SET published_at = created_at WHERE published_at IS NULL;

-- 새로 작성되는 게시물은 기본적으로 작성 시점을 published_at으로
ALTER TABLE public.posts ALTER COLUMN published_at SET DEFAULT now();

-- 프로젝트가 비공개 → 공개로 전환되는 순간, 그 프로젝트의 게시물들을 "지금" 공개된 것으로 갱신
CREATE OR REPLACE FUNCTION public.bump_posts_published_at_on_publish()
RETURNS trigger AS $$
BEGIN
  IF NEW.visibility = 'public' AND OLD.visibility IS DISTINCT FROM 'public' THEN
    UPDATE public.posts SET published_at = now() WHERE project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_bump_posts_published_at_on_publish ON public.projects;
CREATE TRIGGER trg_bump_posts_published_at_on_publish
AFTER UPDATE OF visibility ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.bump_posts_published_at_on_publish();
