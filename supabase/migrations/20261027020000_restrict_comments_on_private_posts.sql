-- 버그: 게시물이 공개 상태일 때 달린 댓글/대댓글이 있는 상태에서 프로젝트를
-- 비공개로 전환하면,
--   1) comments RLS/검증 트리거가 프로젝트 공개여부를 전혀 체크 안 해서,
--      글쓴이 본인이 아닌 사람도 여전히 그 게시물에 새 댓글/좋아요를 달 수 있고
--      댓글 목록도 계속 읽을 수 있었음(게시물 자체는 비공개라 못 보면서
--      댓글만 읽고 쓸 수 있는 모순).
--   2) 글쓴이가 비공개 전환 후 기존 댓글에 답글을 달면, 그 댓글 작성자에게
--      알림이 가지만 정작 비공개라 게시물에 들어갈 수 없어서 알림만 뜨고
--      아무것도 못 보는 깨진 경험이 생김.
--
-- 해결: "비공개 = 소셜 기능(좋아요/댓글) 자체가 꺼짐"으로 단순화. 본인만 보는
-- 개인 기록이 필요하면 이미 별도로 있는 뜨개 로그 기능을 쓰면 되므로, 댓글로
-- 혼자 메모하는 경로를 따로 열어둘 필요 없음 — 글쓴이 포함 전원 작성 차단.
--   1) check_comment_allowed/check_like_allowed: 프로젝트가 비공개면 글쓴이
--      본인 포함 누구도 좋아요/댓글 작성 자체를 할 수 없음.
--   2) comments SELECT 정책에 프로젝트 공개여부 체크 추가 — 비공개면 글쓴이만 조회 가능
--      (기존 댓글을 읽는 것은 그대로 허용).
--   3) notify_users_of_new_comment: 비공개면 애초에 댓글 작성이 불가능하니
--      도달할 일 없는 코드지만, 방어적으로 알림도 막아둠.
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것

-- 1) 좋아요 검증: 비공개 게시물은 글쓴이 포함 누구도 좋아요 불가
CREATE OR REPLACE FUNCTION public.check_like_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_likes_enabled boolean;
  project_visibility text;
BEGIN
  SELECT p.user_id, COALESCE(pr.likes_enabled, true), pr.visibility
    INTO post_owner_id, project_likes_enabled, project_visibility
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_likes_enabled THEN
    RAISE EXCEPTION '이 게시물은 좋아요가 꺼져있습니다.';
  END IF;

  IF project_visibility = 'private' THEN
    RAISE EXCEPTION '비공개 게시물입니다.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = post_owner_id AND blocked_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION '차단된 사용자는 활동할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) 댓글 검증: 비공개 게시물은 글쓴이 포함 누구도 댓글/대댓글 작성 불가
CREATE OR REPLACE FUNCTION public.check_comment_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_comments_enabled boolean;
  project_visibility text;
BEGIN
  SELECT p.user_id, COALESCE(pr.comments_enabled, true), pr.visibility
    INTO post_owner_id, project_comments_enabled, project_visibility
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_comments_enabled THEN
    RAISE EXCEPTION '이 게시물은 댓글이 꺼져있습니다.';
  END IF;

  IF project_visibility = 'private' THEN
    RAISE EXCEPTION '비공개 게시물입니다.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = post_owner_id AND blocked_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION '차단된 사용자는 활동할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) 댓글 조회: 비공개 게시물의 댓글은 글쓴이만 볼 수 있음(게시물 자체 조회
--    정책과 동일한 기준으로 맞춤)
DROP POLICY IF EXISTS "View visible comments, owner can see own hidden ones" ON public.comments;
CREATE POLICY "View visible comments, owner can see own hidden ones" ON public.comments
FOR SELECT TO authenticated
USING (
  (
    is_hidden = false
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
  )
  AND (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.projects pr ON pr.id = p.project_id
      WHERE p.id = comments.post_id AND pr.visibility = 'public'
    )
  )
);

-- 4) 댓글 알림: 비공개 게시물이면 알림 자체를 안 보냄
CREATE OR REPLACE FUNCTION public.notify_users_of_new_comment()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_visibility text;
  parent_author_id uuid;
  recipient_ids uuid[] := ARRAY[]::uuid[];
  recipient_id uuid;
  commenter_nickname text;
  notif_body text;
BEGIN
  SELECT p.user_id, pr.visibility INTO post_owner_id, project_visibility
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF project_visibility = 'private' THEN
    RETURN NEW;
  END IF;

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
