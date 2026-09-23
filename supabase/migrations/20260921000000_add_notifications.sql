-- 알림 인프라: 디바이스 토큰 저장 + 인앱 알림(알림센터) 테이블
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

-- 1) 디바이스 푸시 토큰
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON public.device_tokens(user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2) 알림 켜기/끄기 (유저별 수신 설정)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- 3) 인앱 알림(알림센터에 쌓이는 개별 알림)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('notice', 'project_post')),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications read" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4) 공지사항: 등록 시 알림 발송 여부를 선택할 수 있게 컬럼 추가
-- 관리자가 SQL로 공지 등록할 때 send_notification=true로 넣은 경우에만,
-- 그리고 "새로 등록(INSERT)"될 때만 알림이 나가고 수정(UPDATE)으로는 안 나감
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS send_notification boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.notify_users_of_new_notice()
RETURNS trigger AS $$
BEGIN
  IF NEW.send_notification THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT id, 'notice', NEW.title, left(NEW.content, 100), jsonb_build_object('noticeId', NEW.id)
    FROM public.users
    WHERE notifications_enabled = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_notice ON public.notices;
CREATE TRIGGER trg_notify_new_notice
AFTER INSERT ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_of_new_notice();
