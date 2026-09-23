-- 공지사항 알림을 완전히 고정된 제목/본문으로 발송 (제목: "공지사항",
-- 본문: "뜨지의 새로운 소식을 확인해보세요!") — 공지 내용을 미리보기로 노출하지 않음
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것

CREATE OR REPLACE FUNCTION public.notify_users_of_new_notice()
RETURNS trigger AS $$
DECLARE
  target_user_ids uuid[];
  notif_title text := '공지사항';
  notif_body text := '뜨지의 새로운 소식을 확인해보세요!';
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
  SELECT uid, 'notice', notif_title, notif_body, jsonb_build_object('noticeId', NEW.id)
  FROM unnest(target_user_ids) AS uid;

  PERFORM net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push-fcm',
    headers := jsonb_build_object(
      'x-internal-secret', '<INTERNAL_FUNCTION_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userIds', to_jsonb(target_user_ids),
      'title', notif_title,
      'body', notif_body,
      'data', jsonb_build_object('noticeId', NEW.id)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
