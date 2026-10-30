-- google-voided-purchases-sync Edge Function을 하루 1회 자동 호출하는 pg_cron 스케줄
-- (Google Play는 소모성 상품 환불을 실시간 웹훅으로 안 주기 때문에 주기적으로 조회해야 함)
--
-- 적용 전 준비물:
--   1) Edge Function을 JWT 검증 없이 배포 (Supabase의 새 API 키 포맷(sb_secret_...)은
--      verify_jwt 게이트웨이 체크를 통과 못 하므로, send-push-fcm과 동일하게 자체
--      비밀값으로 인증함):
--        supabase functions deploy google-voided-purchases-sync --no-verify-jwt
--   2) 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체
--      (INTERNAL_FUNCTION_SECRET는 send-push-fcm 등록 때와 동일한 값이어야 함,
--       비밀값이므로 이 파일을 실제 값 채운 채로 커밋하지 말 것)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행 (프로젝트별로 값 다르게 채울 것)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'google-voided-purchases-sync-daily',
  '0 20 * * *', -- UTC 20:00 = KST 05:00, 매일 1회
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/google-voided-purchases-sync',
    headers := jsonb_build_object(
      'x-internal-secret', '<INTERNAL_FUNCTION_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인: SELECT * FROM cron.job;
-- 스케줄 제거: SELECT cron.unschedule('google-voided-purchases-sync-daily');
