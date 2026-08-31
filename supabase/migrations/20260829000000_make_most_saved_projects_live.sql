-- "뜨개함에 많이 저장됐어요": 하루 1회 캐시 테이블 대신 실시간 RPC 직접 호출로 전환
-- get_most_saved_projects를 SECURITY DEFINER로 바꿔 saved_projects RLS(본인 것만 조회 가능)를
-- 우회하고 정확한 저장 수를 집계하도록 함. 함수 자체가 공개 프로젝트(visibility='public')만
-- 대상으로 하므로 비공개 프로젝트/데이터가 노출되지는 않음.
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
  SELECT
    p.id AS project_id,
    p.title,
    p.thumbnail_url,
    p.started_at,
    p.completed_at,
    p.is_completed,
    u.nickname AS owner_nickname,
    u.profile_image AS owner_profile_image,
    COUNT(sp.id) AS save_count
  FROM public.saved_projects sp
  JOIN public.projects p ON p.id = sp.project_id
  JOIN public.users u ON u.id = p.user_id
  WHERE p.visibility = 'public'
  GROUP BY p.id, p.title, p.thumbnail_url, p.started_at, p.completed_at, p.is_completed, u.nickname, u.profile_image
  ORDER BY save_count DESC, p.id
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_most_saved_projects(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_most_saved_projects(integer) TO authenticated;
