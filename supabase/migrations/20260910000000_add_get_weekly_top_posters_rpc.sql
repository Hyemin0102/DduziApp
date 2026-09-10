-- "이번주 뜨개왕": 지난 주(월요일 00:00 ~ 일요일 23:59, 한국시간 기준)에
-- 게시물을 가장 많이 올린 유저 상위 N명을 뽑는 RPC.
-- 지난 주 확정된 결과를 이번 주 내내 고정으로 보여주는 방식(월요일에 리셋)이라,
-- 주 초반에도 데이터가 비어 보이지 않고 순위가 이번 주 동안 안정적으로 유지됨.
--
-- 홈 피드와 동일하게 공개 프로젝트(visibility='public')에 속한 게시물만 집계 대상으로
-- 해서, 비공개 프로젝트의 활동량이 노출되지 않도록 함.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.get_weekly_top_posters(limit_count integer DEFAULT 5)
RETURNS TABLE (
  user_id uuid,
  nickname text,
  profile_image text,
  post_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_bounds AS (
    SELECT
      (date_trunc('week', now() AT TIME ZONE 'Asia/Seoul') - interval '7 days') AT TIME ZONE 'Asia/Seoul' AS week_start,
      (date_trunc('week', now() AT TIME ZONE 'Asia/Seoul')) AT TIME ZONE 'Asia/Seoul' AS week_end
  )
  SELECT
    u.id AS user_id,
    u.nickname,
    u.profile_image,
    COUNT(p.id) AS post_count
  FROM public.posts p
  JOIN public.users u ON u.id = p.user_id
  JOIN public.projects pr ON pr.id = p.project_id
  CROSS JOIN week_bounds w
  WHERE pr.visibility = 'public'
    AND p.created_at >= w.week_start
    AND p.created_at < w.week_end
  GROUP BY u.id, u.nickname, u.profile_image
  ORDER BY post_count DESC, u.id
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_top_posters(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_top_posters(integer) TO authenticated;
