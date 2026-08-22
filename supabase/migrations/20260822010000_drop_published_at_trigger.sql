-- published_at 기반 피드 정렬을 created_at으로 단순화함에 따라 트리거 제거
DROP TRIGGER IF EXISTS trg_bump_posts_published_at_on_publish ON public.projects;
DROP FUNCTION IF EXISTS public.bump_posts_published_at_on_publish();
