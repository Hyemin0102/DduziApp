-- 검색 화면 "최근 뜨개함에 저장됐어요" 섹션 — 저장 횟수 기준 정렬에서 최근 저장 시각
-- 기준 정렬로 변경. 저장 기능 자체가 자주 쓰이지 않아 총 저장 횟수로 정렬하면 항상
-- 같은 프로젝트가 상위에 고정되는 문제가 있었음 (화면 라벨은 이미 "최근"이라 되어있어서
-- 이 변경이 라벨과 실제 동작을 일치시킴)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.get_most_saved_projects(limit_count integer DEFAULT 5)
RETURNS TABLE (
  project_id uuid,
  title text,
  thumbnail_url text,
  started_at date,
  completed_at date,
  is_completed boolean,
  owner_nickname text,
  owner_profile_image text,
  save_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_saves AS (
    SELECT
      sp.project_id,
      MAX(sp.created_at) AS last_saved_at,
      COUNT(sp.id) AS save_count
    FROM public.saved_projects sp
    JOIN public.projects p ON p.id = sp.project_id
    WHERE p.visibility = 'public'
    GROUP BY sp.project_id
  )
  SELECT
    p.id AS project_id,
    p.title,
    p.thumbnail_url,
    p.started_at,
    p.completed_at,
    p.is_completed,
    u.nickname AS owner_nickname,
    u.profile_image AS owner_profile_image,
    ls.save_count
  FROM latest_saves ls
  JOIN public.projects p ON p.id = ls.project_id
  JOIN public.users u ON u.id = p.user_id
  ORDER BY ls.last_saved_at DESC, p.id
  LIMIT limit_count;
$$;
