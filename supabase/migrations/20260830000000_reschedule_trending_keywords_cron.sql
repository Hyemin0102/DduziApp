-- compute-trending-keywords 배치 실행 시각을 새벽 4시(KST) -> 낮 12시(KST)로 변경
-- cron.schedule은 동일한 jobname으로 다시 호출하면 기존 스케줄을 갱신(upsert)함
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 <SERVICE_ROLE_KEY> 채워서 실행

SELECT cron.schedule(
  'compute-trending-keywords-daily',
  '0 3 * * *', -- UTC 03:00 = KST 12:00, 매일 1회
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
