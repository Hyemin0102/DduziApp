-- private 프로젝트의 posts / knitting_logs / post_images가
-- USING (true) 정책으로 누구에게나 노출되던 문제 수정
--
-- 적용 방법: Supabase Dashboard → SQL Editor에 붙여넣어 실행

-- ── posts ─────────────────────────────────────────────────────────────────
-- 기존: 모든 post가 공개
-- 변경: public 프로젝트에 연결된 post만 공개
--       본인 post 조회는 기존 "Users can view own posts" 정책이 그대로 담당
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

CREATE POLICY "Anyone can view public project posts" ON public.posts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = posts.project_id
    AND projects.visibility = 'public'
  )
);

-- ── knitting_logs ──────────────────────────────────────────────────────────
-- 기존: 모든 knitting_log가 공개
-- 변경: public 프로젝트의 로그만 공개, 본인 프로젝트 로그는 항상 조회 가능
DROP POLICY IF EXISTS "Anyone can view knitting logs" ON public.knitting_logs;

CREATE POLICY "Anyone can view public project knitting logs" ON public.knitting_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = knitting_logs.project_id
    AND projects.visibility = 'public'
  )
);

CREATE POLICY "Users can view own knitting logs" ON public.knitting_logs
FOR SELECT USING (
  auth.uid() = (
    SELECT projects.user_id FROM public.projects
    WHERE projects.id = knitting_logs.project_id
  )
);

-- ── post_images ────────────────────────────────────────────────────────────
-- 기존: 모든 post_image가 공개
-- 변경: public 프로젝트 게시물의 이미지만 공개, 본인 게시물 이미지는 항상 조회 가능
DROP POLICY IF EXISTS "Anyone can view post images" ON public.post_images;

CREATE POLICY "Anyone can view public project post images" ON public.post_images
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.posts
    JOIN public.projects ON projects.id = posts.project_id
    WHERE posts.id = post_images.post_id
    AND projects.visibility = 'public'
  )
);

CREATE POLICY "Users can view own post images" ON public.post_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
);
