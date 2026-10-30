-- 댓글 알림 푸시가 403(Forbidden)으로 실패하던 문제 수정.
-- notify_users_of_new_comment의 x-internal-secret 값이 send-push-fcm의 INTERNAL_FUNCTION_SECRET과
-- 달라서 생긴 문제. 좋아요 알림 함수(notify_post_owner_of_like)에서 실제로 성공하는 값과 같은 값을 넣을 것.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체한 뒤 SQL Editor에서 실행할 것

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
