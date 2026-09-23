-- 공지사항 알림: 등록(INSERT) 시점뿐 아니라, 이미 등록된 공지의 알림 여부가
-- false -> true로 바뀌는 수정(UPDATE) 시점에도 알림이 나가도록 확장.
-- 단, 이미 true였던 걸 다시 true로 저장(텍스트만 수정 등)한 경우는 재발송하지 않음.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.notify_users_of_new_notice()
RETURNS trigger AS $$
DECLARE
  target_user_ids uuid[];
  notif_title text := '공지사항';
  notif_body text := '뜨지의 새로운 소식을 확인해보세요!';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT NEW.send_notification THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- false -> true로 바뀐 경우에만 발송. 이미 true였던 걸 다시 true로
    -- 저장한 경우(텍스트만 수정 등)는 제외
    IF NOT (OLD.send_notification = false AND NEW.send_notification = true) THEN
      RETURN NEW;
    END IF;
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

DROP TRIGGER IF EXISTS trg_notify_new_notice ON public.notices;
CREATE TRIGGER trg_notify_new_notice
AFTER INSERT OR UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_of_new_notice();
