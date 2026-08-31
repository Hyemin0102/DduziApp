-- 검색 화면 "뜨개함에 많이 저장됐어요" 섹션용: 저장 횟수가 많은 공개 프로젝트 상위 N개 조회
-- 비공개 프로젝트는 저장 수와 무관하게 제외 (트렌드 키워드와 동일한 이유 — 비공개 의도 보호)
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
