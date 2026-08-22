-- 프로젝트 비공개 → 공개 전환 시 모든 게시물의 published_at을 갱신하던 것을
-- 가장 최근 게시물 1개만 갱신하도록 수정
CREATE OR REPLACE FUNCTION public.bump_posts_published_at_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.visibility = 'public' AND OLD.visibility IS DISTINCT FROM 'public' THEN
    UPDATE public.posts
    SET published_at = now()
    WHERE id = (
      SELECT id FROM public.posts
      WHERE project_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$;
