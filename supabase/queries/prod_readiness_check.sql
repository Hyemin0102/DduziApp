-- prod에 트렌드 키워드/많이 저장된 프로젝트 기능을 배포하기 전, 필요한 선행 스키마가
-- 이미 적용돼 있는지 확인하는 체크 쿼리. 결과가 전부 true면 20260824030000 이후 것만
-- 추가로 실행하면 되고, false가 있으면 해당 마이그레이션부터 순서대로 실행해야 함.

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'thumbnail_url'
  ) AS has_project_thumbnail_dates_cols,          -- 20260824010000
  to_regclass('public.saved_projects') IS NOT NULL AS has_saved_projects_table,  -- 20260824000000
  EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload own project thumbnails'
  ) AS has_thumbnail_upload_policy,                -- 20260824020000
  to_regclass('public.trending_keywords') IS NOT NULL AS has_trending_keywords_table,  -- 20260824030000
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_most_saved_projects') AS has_most_saved_rpc,  -- 20260824050000
  to_regclass('public.most_saved_projects') IS NOT NULL AS has_most_saved_projects_table;  -- 20260824060000
