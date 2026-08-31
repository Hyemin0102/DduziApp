-- 검색 화면 "뜨개함에 많이 저장됐어요" 캐시 테이블
-- compute-trending-keywords Edge Function이 트렌드 키워드와 같은 배치(하루 1회)에서
-- get_most_saved_projects()를 service_role로 호출해 결과를 통째로 갈아끼움.
-- (get_most_saved_projects 자체는 SECURITY INVOKER라 일반 유저가 직접 호출하면
--  saved_projects RLS(본인 것만 조회 가능) 때문에 카운트가 왜곡됨 — 그래서 캐싱이 필요함)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.most_saved_projects (
  rank integer PRIMARY KEY,
  project_id uuid NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  started_at date,
  completed_at date,
  is_completed boolean NOT NULL,
  owner_nickname text NOT NULL,
  owner_profile_image text,
  save_count integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.most_saved_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view most saved projects" ON public.most_saved_projects
FOR SELECT TO public
USING (true);
