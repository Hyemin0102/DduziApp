-- 좋아요/댓글 알림 문구에 누가 그랬는지(닉네임) 넣기.
-- "닉네임" 부분은 앱의 알림센터 목록에서 굵게 표시할 거라, data에도 nickname을
-- 따로 저장해둠(푸시 알림 배너 자체는 OS 영역이라 굵게는 안 되고 body 평문만 감).
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것

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

  SELECT nickname INTO liker_nickname FROM public.users WHERE id = NEW.user_id;
  notif_body := COALESCE(liker_nickname, '회원') || '님이 회원님의 게시물을 좋아합니다.';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id, 'post_like', '좋아요',
    notif_body,
    jsonb_build_object('postId', NEW.post_id, 'nickname', liker_nickname)
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

CREATE OR REPLACE FUNCTION public.notify_users_of_new_comment()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  parent_author_id uuid;
  recipient_ids uuid[] := ARRAY[]::uuid[];
  recipient_id uuid;
  commenter_nickname text;
  notif_body text;
BEGIN
  SELECT p.user_id INTO post_owner_id FROM public.posts p WHERE p.id = NEW.post_id;

  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT c.user_id INTO parent_author_id FROM public.comments c WHERE c.id = NEW.parent_comment_id;
  END IF;

  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    recipient_ids := array_append(recipient_ids, post_owner_id);
  END IF;
  IF parent_author_id IS NOT NULL
     AND parent_author_id != NEW.user_id
     AND parent_author_id != post_owner_id THEN
    recipient_ids := array_append(recipient_ids, parent_author_id);
  END IF;

  SELECT nickname INTO commenter_nickname FROM public.users WHERE id = NEW.user_id;
  notif_body := COALESCE(commenter_nickname, '회원') || '님이 댓글을 남겼습니다.';

  FOREACH recipient_id IN ARRAY recipient_ids LOOP
    IF EXISTS (
      SELECT 1 FROM public.users
      WHERE id = recipient_id
        AND notifications_enabled = true
        AND comment_notifications_enabled = true
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        recipient_id, 'comment', '댓글', notif_body,
        jsonb_build_object(
          'postId', NEW.post_id,
          'commentId', NEW.id,
          'nickname', commenter_nickname
        )
      );

      PERFORM net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push-fcm',
        headers := jsonb_build_object(
          'x-internal-secret', '<INTERNAL_FUNCTION_SECRET>',
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'userIds', to_jsonb(ARRAY[recipient_id]),
          'title', '댓글',
          'body', notif_body,
          'data', jsonb_build_object('postId', NEW.post_id, 'commentId', NEW.id)
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
