-- 운영 지표 확인용 조회 쿼리 모음 (스키마에 영향 없는 SELECT만, 대시보드 SQL Editor에 붙여넣어 실행)

-- ── 프로젝트를 1개 이상 올린 유저 기준, 유저당 평균 프로젝트 수 ──────────────
SELECT
  COUNT(DISTINCT user_id) AS users_with_projects,
  COUNT(*) AS total_projects,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 2) AS avg_projects_per_user
FROM public.projects;

-- ── 전체 가입자 대비, 프로젝트를 1개 이상 올린 유저 수/비율 ──────────────────
SELECT
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT p.user_id) AS users_with_projects,
  ROUND(COUNT(DISTINCT p.user_id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0) * 100, 1) AS pct_users_with_projects
FROM public.users u
LEFT JOIN public.projects p ON p.user_id = u.id;

-- ── 유저별 프로젝트 개수 순위 (많이 올린 순) ─────────────────────────────────
SELECT u.nickname, COUNT(p.id) AS project_count
FROM public.users u
LEFT JOIN public.projects p ON p.user_id = u.id
GROUP BY u.id, u.nickname
ORDER BY project_count DESC;

-- ── 프로젝트별 게시물 개수 (많은 순) ─────────────────────────────────────────
SELECT pr.id AS project_id, pr.title, COUNT(po.id) AS post_count
FROM public.projects pr
LEFT JOIN public.posts po ON po.project_id = pr.id
GROUP BY pr.id, pr.title
ORDER BY post_count DESC;

-- ── 프로젝트당 평균 게시물 수 ────────────────────────────────────────────────
SELECT ROUND(AVG(post_count)::numeric, 2) AS avg_posts_per_project
FROM (
  SELECT pr.id, COUNT(po.id) AS post_count
  FROM public.projects pr
  LEFT JOIN public.posts po ON po.project_id = pr.id
  GROUP BY pr.id
) t;
