-- 댓글 신고가 3건 이상 쌓이면 자동으로 숨김 처리 (관리자 수동 처리 부담 감소)
-- 숨김은 comments.is_hidden을 true로 바꾸는 방식이라, 기존 RLS 정책(is_hidden = false만 조회)에 따라
-- 작성자·게시물 주인 포함 누구에게도 보이지 않음. 복구는 관리자가 is_hidden을 false로 되돌리면 됨.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.auto_hide_reported_comment()
RETURNS trigger AS $$
DECLARE
  report_count integer;
BEGIN
  IF NEW.comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO report_count
  FROM public.reports
  WHERE comment_id = NEW.comment_id;

  IF report_count >= 3 THEN
    UPDATE public.comments
    SET is_hidden = true
    WHERE id = NEW.comment_id AND is_hidden = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_hide_reported_comment ON public.reports;
CREATE TRIGGER trg_auto_hide_reported_comment
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.auto_hide_reported_comment();
