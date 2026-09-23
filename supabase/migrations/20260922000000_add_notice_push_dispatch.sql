-- 공지사항 알림 트리거 확장: notifications 행 생성에 더해 send-push-fcm Edge
-- Function을 호출해서 실제 FCM 푸시까지 발송함
--
-- 적용 전 준비물:
--   1) Edge Function을 JWT 검증 없이 배포 (내부 전용 함수라 Supabase JWT 대신
--      자체 비밀값으로 인증함):
--        supabase functions deploy send-push-fcm --no-verify-jwt
--   2) Function Secrets 등록:
--      - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
--        (Firebase Console > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성으로
--        받은 JSON의 project_id/client_email/private_key)
--      - INTERNAL_FUNCTION_SECRET: 아무 임의의 긴 문자열 (예: openssl rand -hex 32로 생성)
--   3) 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체해서 SQL
--      Editor에 직접 실행 (비밀값이므로 이 파일을 실제 값 채운 채로 커밋하지 말 것.
--      <INTERNAL_FUNCTION_SECRET>는 2번에서 등록한 것과 정확히 같은 값이어야 함)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행 (프로젝트별로 값 다르게 채울 것)

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_users_of_new_notice()
RETURNS trigger AS $$
DECLARE
  target_user_ids uuid[];
BEGIN
  IF NOT NEW.send_notification THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(id) INTO target_user_ids
  FROM public.users
  WHERE notifications_enabled = true;

  IF target_user_ids IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT uid, 'notice', NEW.title, left(NEW.content, 100), jsonb_build_object('noticeId', NEW.id)
  FROM unnest(target_user_ids) AS uid;

  PERFORM net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push-fcm',
    headers := jsonb_build_object(
      'x-internal-secret', '<INTERNAL_FUNCTION_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userIds', to_jsonb(target_user_ids),
      'title', NEW.title,
      'body', left(NEW.content, 100)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
