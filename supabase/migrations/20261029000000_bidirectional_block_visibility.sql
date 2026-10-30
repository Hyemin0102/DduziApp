-- 차단을 양방향으로 만듦. 지금까지는 "내가 차단한 사람의 게시물이 내 피드에서
-- 안 보임"만 (클라이언트 필터링으로) 구현돼 있었고, 반대 방향 — 차단당한 사람이
-- 차단한 사람의 게시물/프로젝트를 보는 것 — 은 전혀 막혀있지 않았음. 인스타그램/
-- 트위터 등 일반적인 차단은 상호 비가시(mutual invisibility)가 기본이라 이에 맞춤.
--
-- 핵심은 DB 레벨(RLS)에서 막는 것 — 클라이언트 필터링만으로는 차단당한 쪽에서
-- API를 직접 호출하면 우회 가능하기 때문.
--
-- is_blocked_either_way()를 SECURITY DEFINER로 만든 이유: 이 함수를 RLS 정책
-- 안에서 쓰면, blocks 테이블 자체의 제한적인 SELECT 정책(차단한 사람만 자기
-- 차단목록 조회 가능)과 무관하게 항상 정확히 평가됨. SECURITY DEFINER가 아니면
-- 차단당한 사람 쪽에서 서브쿼리가 blocks 테이블의 RLS에 걸려 0행으로 평가되고,
-- 그러면 "차단 안 당함"으로 잘못 판정돼서 반대 방향이 조용히 안 먹힘.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.is_blocked_either_way(user_a uuid, user_b uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = user_a AND b.blocked_id = user_b)
       OR (b.blocker_id = user_b AND b.blocked_id = user_a)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ── posts ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view public project posts" ON public.posts;
CREATE POLICY "Anyone can view public project posts" ON public.posts
FOR SELECT USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = posts.project_id
    AND projects.visibility = 'public'
  )
  AND NOT public.is_blocked_either_way(auth.uid(), posts.user_id)
);

-- ── projects (공개 조회 정책 2개 + 저장한 프로젝트 조회 정책, 전부 동일 적용) ──
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.projects;
CREATE POLICY "Anyone can view public posts" ON public.projects
FOR SELECT USING (
  (visibility)::text = 'public'
  AND NOT public.is_blocked_either_way(auth.uid(), projects.user_id)
);

DROP POLICY IF EXISTS "View public projects" ON public.projects;
CREATE POLICY "View public projects" ON public.projects
FOR SELECT USING (
  (visibility)::text = 'public'
  AND NOT public.is_blocked_either_way(auth.uid(), projects.user_id)
);

DROP POLICY IF EXISTS "Users can view projects they saved" ON public.projects;
CREATE POLICY "Users can view projects they saved" ON public.projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.saved_projects
    WHERE saved_projects.project_id = projects.id
      AND saved_projects.user_id = auth.uid()
  )
  AND NOT public.is_blocked_either_way(auth.uid(), projects.user_id)
);

-- ── knitting_logs ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view public project knitting logs" ON public.knitting_logs;
CREATE POLICY "Anyone can view public project knitting logs" ON public.knitting_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = knitting_logs.project_id
    AND projects.visibility = 'public'
    AND NOT public.is_blocked_either_way(auth.uid(), projects.user_id)
  )
);

-- ── post_images ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view public project post images" ON public.post_images;
CREATE POLICY "Anyone can view public project post images" ON public.post_images
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.posts
    JOIN public.projects ON projects.id = posts.project_id
    WHERE posts.id = post_images.post_id
    AND projects.visibility = 'public'
    AND NOT public.is_blocked_either_way(auth.uid(), posts.user_id)
  )
);

-- ── 좋아요/댓글 작성 검증: 차단도 양방향으로(지금까진 게시물 주인이 나를
--    차단했는지만 봤음 — 반대로 내가 게시물 주인을 차단한 경우는 안 막혔음) ──
CREATE OR REPLACE FUNCTION public.check_like_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_likes_enabled boolean;
  project_visibility text;
BEGIN
  SELECT p.user_id, COALESCE(pr.likes_enabled, true), pr.visibility
    INTO post_owner_id, project_likes_enabled, project_visibility
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_likes_enabled THEN
    RAISE EXCEPTION '이 게시물은 좋아요가 꺼져있습니다.';
  END IF;

  IF project_visibility = 'private' THEN
    RAISE EXCEPTION '비공개 게시물입니다.';
  END IF;

  IF public.is_blocked_either_way(post_owner_id, NEW.user_id) THEN
    RAISE EXCEPTION '차단된 사용자는 활동할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_comment_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_comments_enabled boolean;
  project_visibility text;
BEGIN
  SELECT p.user_id, COALESCE(pr.comments_enabled, true), pr.visibility
    INTO post_owner_id, project_comments_enabled, project_visibility
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_comments_enabled THEN
    RAISE EXCEPTION '이 게시물은 댓글이 꺼져있습니다.';
  END IF;

  IF project_visibility = 'private' THEN
    RAISE EXCEPTION '비공개 게시물입니다.';
  END IF;

  IF public.is_blocked_either_way(post_owner_id, NEW.user_id) THEN
    RAISE EXCEPTION '차단된 사용자는 활동할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
