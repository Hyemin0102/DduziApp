-- compute-trending-keywords Edge Function을 매일 1회 자동 호출하는 pg_cron 스케줄
--
-- 적용 전 준비물:
--   1) Edge Function 배포: supabase functions deploy compute-trending-keywords
--   2) 아래 <PROJECT_REF>, <SERVICE_ROLE_KEY>를 실제 값으로 교체
--      (Dashboard > Project Settings > API 에서 확인 가능. service_role 키는 비밀값이므로
--       이 파일을 그대로 커밋하지 말고, 대시보드 SQL Editor에만 값 채워서 실행할 것)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행 (프로젝트별로 값 다르게 채울 것)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'compute-trending-keywords-daily',
  '0 19 * * *', -- UTC 19:00 = KST 04:00, 매일 1회
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/compute-trending-keywords',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인: SELECT * FROM cron.job;
-- 스케줄 제거: SELECT cron.unschedule('compute-trending-keywords-daily');
