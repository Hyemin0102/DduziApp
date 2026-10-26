-- 1) 게시물도 댓글과 동일하게 신고 3건 이상 쌓이면 자동 숨김 처리.
--    숨김은 posts.is_hidden을 true로 바꾸는 방식이고, 작성자 본인 포함 누구에게도 안 보이게 함
--    (댓글 자동숨김과 동일한 정책). 복구는 관리자가 is_hidden을 false로 되돌리면 됨.
-- 2) 신고 메일/DB에 "누구를 신고한 건지"(작성자)가 아예 없던 문제 수정 — reports에
--    reported_user_id/reported_user_nickname 추가(닉네임은 스냅샷이라 나중에 유저가
--    닉네임을 바꾸거나 탈퇴해도 신고 당시 작성자를 알아볼 수 있음).
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

-- ── 1) posts.is_hidden ──────────────────────────────────────────────────────
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can view public project posts" ON public.posts;
CREATE POLICY "Anyone can view public project posts" ON public.posts
FOR SELECT USING (
  is_hidden = false
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = posts.project_id
    AND projects.visibility = 'public'
  )
);

DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
CREATE POLICY "Users can view own posts" ON public.posts
FOR SELECT USING (auth.uid() = user_id AND is_hidden = false);

-- 기존 auto_hide_reported_comment 함수/트리거를 댓글+게시물 둘 다 처리하도록 확장하면서
-- 이름도 실제 동작에 맞게 변경
DROP TRIGGER IF EXISTS trg_auto_hide_reported_comment ON public.reports;
DROP FUNCTION IF EXISTS public.auto_hide_reported_comment();

CREATE OR REPLACE FUNCTION public.auto_hide_reported_content()
RETURNS trigger AS $$
DECLARE
  report_count integer;
BEGIN
  IF NEW.comment_id IS NOT NULL THEN
    SELECT count(*) INTO report_count
    FROM public.reports
    WHERE comment_id = NEW.comment_id;

    IF report_count >= 3 THEN
      UPDATE public.comments
      SET is_hidden = true
      WHERE id = NEW.comment_id AND is_hidden = false;
    END IF;
  ELSE
    SELECT count(*) INTO report_count
    FROM public.reports
    WHERE post_id = NEW.post_id AND comment_id IS NULL;

    IF report_count >= 3 THEN
      UPDATE public.posts
      SET is_hidden = true
      WHERE id = NEW.post_id AND is_hidden = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_hide_reported_content
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.auto_hide_reported_content();

-- ── 2) reports에 작성자 스냅샷 추가 ───────────────────────────────────────────
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_user_nickname text;
