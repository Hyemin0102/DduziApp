-- 좋아요/댓글 기능 추가
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것
-- (비밀값이므로 이 파일을 실제 값 채운 채로 커밋하지 말 것)

-- 1) 프로젝트별 좋아요/댓글 on-off (기본 켜짐)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS likes_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true;

-- 2) 좋아요/댓글 알림 개별 설정 (기본 켜짐, notifications_enabled 마스터 스위치와 별개로 세부 제어)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS like_notifications_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS comment_notifications_enabled boolean NOT NULL DEFAULT true;

-- 3) notifications.type CHECK 제약에 좋아요/댓글 타입 추가
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('notice', 'project_post', 'post_like', 'comment'));

-- 4) likes 테이블
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS likes_post_id_idx ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view likes" ON public.likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can like as themselves" ON public.likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own like" ON public.likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 5) comments 테이블 (대댓글은 parent_comment_id로 1단계만 — 앱에서 항상
-- "최상위 원댓글 id"를 parent_comment_id로 보내는 방식으로 평탄화해서 유지)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 1000),
  is_hidden boolean NOT NULL DEFAULT false,
  is_edited boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON public.comments(parent_comment_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 숨긴 댓글은 게시물 주인 본인(숨긴 목록 확인용) 말고는 작성자 포함 아무도 못 봄
CREATE POLICY "View visible comments, owner can see own hidden ones" ON public.comments
FOR SELECT TO authenticated
USING (
  is_hidden = false
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
);

CREATE POLICY "Users can comment as themselves" ON public.comments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 수정: 작성자는 content/is_edited, 게시물 주인은 is_hidden만 보낸다는 전제로
-- 행 단위로는 둘 다 허용 (필드별 제한은 앱에서 관리)
CREATE POLICY "Author or post owner can update comment" ON public.comments
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
);

-- 완전 삭제: 작성자 본인 또는 게시물 주인
CREATE POLICY "Author or post owner can delete comment" ON public.comments
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.user_id = auth.uid())
);

-- 6) 좋아요/댓글 작성 전 검증: 프로젝트에서 꺼놨거나, 게시물 주인이 차단한
-- 사용자면 막음 (클라이언트만 믿지 않고 DB 레벨에서도 강제)
CREATE OR REPLACE FUNCTION public.check_like_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_likes_enabled boolean;
BEGIN
  SELECT p.user_id, COALESCE(pr.likes_enabled, true)
    INTO post_owner_id, project_likes_enabled
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_likes_enabled THEN
    RAISE EXCEPTION '이 게시물은 좋아요가 꺼져있습니다.';
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

DROP TRIGGER IF EXISTS trg_check_like_allowed ON public.likes;
CREATE TRIGGER trg_check_like_allowed
BEFORE INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.check_like_allowed();

CREATE OR REPLACE FUNCTION public.check_comment_allowed()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  project_comments_enabled boolean;
BEGIN
  SELECT p.user_id, COALESCE(pr.comments_enabled, true)
    INTO post_owner_id, project_comments_enabled
  FROM public.posts p
  LEFT JOIN public.projects pr ON pr.id = p.project_id
  WHERE p.id = NEW.post_id;

  IF NOT project_comments_enabled THEN
    RAISE EXCEPTION '이 게시물은 댓글이 꺼져있습니다.';
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

DROP TRIGGER IF EXISTS trg_check_comment_allowed ON public.comments;
CREATE TRIGGER trg_check_comment_allowed
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.check_comment_allowed();

-- 7) 좋아요 알림 (본인 게시물에 본인이 좋아요 누른 경우는 제외)
CREATE OR REPLACE FUNCTION public.notify_post_owner_of_like()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  owner_notifications_enabled boolean;
  owner_like_notifications_enabled boolean;
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

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    post_owner_id, 'post_like', '좋아요',
    '회원님의 게시물을 좋아해요.',
    jsonb_build_object('postId', NEW.post_id)
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
      'body', '회원님의 게시물을 좋아해요.',
      'data', jsonb_build_object('postId', NEW.post_id)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_post_owner_of_like ON public.likes;
CREATE TRIGGER trg_notify_post_owner_of_like
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.notify_post_owner_of_like();

-- 8) 댓글/대댓글 알림 — 게시물 주인 + (대댓글이면) 원댓글 작성자.
-- 본인 글/댓글에 본인이 단 경우, 같은 사람 중복 수신은 제외
CREATE OR REPLACE FUNCTION public.notify_users_of_new_comment()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  parent_author_id uuid;
  recipient_ids uuid[] := ARRAY[]::uuid[];
  recipient_id uuid;
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

  FOREACH recipient_id IN ARRAY recipient_ids LOOP
    IF EXISTS (
      SELECT 1 FROM public.users
      WHERE id = recipient_id
        AND notifications_enabled = true
        AND comment_notifications_enabled = true
    ) THEN
      notif_body := CASE WHEN recipient_id = post_owner_id
        THEN '회원님의 게시물에 댓글이 달렸어요.'
        ELSE '회원님의 댓글에 답글이 달렸어요.' END;

      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        recipient_id, 'comment', '댓글', notif_body,
        jsonb_build_object('postId', NEW.post_id, 'commentId', NEW.id)
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

DROP TRIGGER IF EXISTS trg_notify_new_comment ON public.comments;
CREATE TRIGGER trg_notify_new_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_users_of_new_comment();

-- 9) 댓글 신고 — 기존 reports 테이블 확장
-- comment_id는 참조용(댓글이 삭제되면 null로), 실제 신고 내용은
-- reported_content_snapshot에 신고 시점 원문을 스냅샷으로 저장해서
-- 댓글이 나중에 삭제돼도 신고 이력은 원문과 함께 남게 함
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS comment_id uuid REFERENCES public.comments(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_content_snapshot text;
