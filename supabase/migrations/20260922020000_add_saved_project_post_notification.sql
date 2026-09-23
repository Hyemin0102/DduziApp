-- 저장한(뜨개함) 프로젝트에 새 게시물이 올라오면, 그 프로젝트를 저장한 사용자들에게
-- 알림(인앱 기록 + 실제 FCM 푸시)을 발송함. 작성자 본인은 제외.
-- 게시물 내용은 사용자 작성 글이라 검수 없이 노출하면 부적절한 콘텐츠가 다른 사용자
-- 잠금화면에 뜰 수 있어, 제목/본문 모두 고정 문구 + 프로젝트명만 사용
--
-- 적용 전 준비물: send-push-fcm Edge Function이 이미 배포되어 있어야 함
-- (공지사항 알림 작업에서 이미 배포했다면 별도 작업 불필요)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 아래 <PROJECT_REF>, <INTERNAL_FUNCTION_SECRET>를 실제 값으로 교체할 것
-- (INTERNAL_FUNCTION_SECRET는 공지사항 알림 때 등록한 것과 동일한 값이어야 함)

CREATE OR REPLACE FUNCTION public.notify_users_of_new_post()
RETURNS trigger AS $$
DECLARE
  target_user_ids uuid[];
  project_title text;
  notif_title text := '새 게시물';
  notif_body text;
BEGIN
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(sp.user_id) INTO target_user_ids
  FROM public.saved_projects sp
  JOIN public.users u ON u.id = sp.user_id
  WHERE sp.project_id = NEW.project_id
    AND sp.user_id != NEW.user_id
    AND u.notifications_enabled = true;

  IF target_user_ids IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.title INTO project_title FROM public.projects p WHERE p.id = NEW.project_id;
  project_title := coalesce(project_title, '저장한 프로젝트');

  -- 본문이 너무 길어지지 않도록 프로젝트 제목만 짧게 자름
  IF length(project_title) > 15 THEN
    project_title := left(project_title, 15) || '...';
  END IF;

  -- chr(39)는 작은따옴표(') 한 글자 — SQL 문자열 리터럴 안에 홑따옴표를 직접 쓰면
  -- 이스케이프가 헷갈려서 이 방식으로 감쌈
  notif_body := chr(39) || project_title || chr(39) || '에 새 게시물이 올라왔어요.';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT uid, 'project_post', notif_title, notif_body,
    jsonb_build_object('projectId', NEW.project_id, 'postId', NEW.id)
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
      'data', jsonb_build_object('postId', NEW.id, 'projectId', NEW.project_id)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_post ON public.posts;
CREATE TRIGGER trg_notify_new_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_of_new_post();
