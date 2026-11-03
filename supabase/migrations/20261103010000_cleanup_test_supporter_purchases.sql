-- 일회성 데이터 정리: prod에서 실결제 전 테스트로 쌓인 본인 계정의 응원 구매 4건
-- 중 가장 오래된 1건만 남기고 나머지를 삭제해서 1단계로 맞춤.
-- 마이그레이션 파일이 아니라 1회성 운영 스크립트 — 실행 후 지워도 무방.
--
-- trg_sync_supporter_level 트리거는 INSERT/UPDATE OF status에서만 자동 발동하고
-- DELETE에는 안 걸려서, 삭제 후 refresh_supporter_level()을 직접 호출해 재계산함.

DELETE FROM public.supporter_purchases
WHERE user_id = (SELECT id FROM public.users WHERE email = 'gkdlt7373@hanmail.net')
  AND status = 'active'
  AND id NOT IN (
    SELECT id FROM public.supporter_purchases
    WHERE user_id = (SELECT id FROM public.users WHERE email = 'gkdlt7373@hanmail.net')
      AND status = 'active'
    ORDER BY purchased_at ASC
    LIMIT 1
  );

SELECT public.refresh_supporter_level(
  (SELECT id FROM public.users WHERE email = 'gkdlt7373@hanmail.net')
);

-- 확인
SELECT id, email, supporter_level, supporter_count
FROM public.users WHERE email = 'gkdlt7373@hanmail.net';
