-- 1) 댓글 작성 속도 제한: 1분 5개, 1시간 30개 (도배/봇 방지)
-- 2) 좋아요 알림 중복 방지: 같은 사람이 같은 게시물에 24시간 안에 다시 좋아요해도 알림/푸시는 한 번만
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것

CREATE INDEX IF NOT EXISTS comments_user_created_idx
  ON public.comments (user_id, created_at);

CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS trigger AS $$
DECLARE
  recent_minute_count integer;
  recent_hour_count integer;
BEGIN
  SELECT count(*) INTO recent_minute_count
  FROM public.comments
  WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute';

  IF recent_minute_count >= 5 THEN
    RAISE EXCEPTION '댓글을 너무 빨리 작성하고 있어요. 잠시 후 다시 시도해주세요.';
  END IF;

  SELECT count(*) INTO recent_hour_count
  FROM public.comments
  WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';

  IF recent_hour_count >= 30 THEN
    RAISE EXCEPTION '1시간 동안 작성할 수 있는 댓글 수를 초과했어요. 잠시 후 다시 시도해주세요.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_comment_rate_limit ON public.comments;
CREATE TRIGGER trg_check_comment_rate_limit
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.check_comment_rate_limit();

CREATE OR REPLACE FUNCTION public.notify_post_owner_of_like()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  owner_notifications_enabled boolean;
  owner_like_notifications_enabled boolean;
  liker_nickname text;
  notif_body text;
BEGIN
  SELECT p.user_id INTO post_owner_id FROM public.posts p WHERE p.id = NEW.post_id;

  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT notifications_enabled, like_notifications_enabled
    INTO owner_notifications_enabled, owner_like_notifications_enabled
  FROM public.users WHERE id = post_owner_id;

  IF NOT COALESCE(owner_notifications_enabled, false)
     OR NOT COALESCE(owner_like_notifications_enabled, false) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = post_owner_id
      AND n.type = 'post_like'
      AND n.data->>'postId' = NEW.post_id::text
      AND n.data->>'likerId' = NEW.user_id::text
      AND n.created_at > now() - interval '24 hours'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT nickname INTO liker_nickname FROM public.users WHERE id = NEW.user_id;
  notif_body := COALESCE(liker_nickname, '회원') || '님이 회원님의 게시물을 좋아합니다.';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id, 'post_like', '좋아요',
    notif_body,
    jsonb_build_object('postId', NEW.post_id, 'nickname', liker_nickname, 'likerId', NEW.user_id)
  );

  PERFORM net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push-fcm',
    headers := jsonb_build_object(
      'x-internal-secret', '<INTERNAL_FUNCTION_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userIds', to_jsonb(ARRAY[post_owner_id]),
      'title', '좋아요',
      'body', notif_body,
      'data', jsonb_build_object('postId', NEW.post_id)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
