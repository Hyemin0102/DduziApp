-- 신고당한 댓글이 삭제되면 reports.comment_id가 ON DELETE SET NULL로 비워지는데(신고
-- 이력은 reported_content_snapshot으로 남김), reports_reporter_post_unique가
-- "comment_id IS NULL = 게시물 신고"로만 판단해서 이 순간 같은 유저가 그 게시물을
-- 이미 신고한 적 있으면 유니크 제약 충돌로 댓글 삭제 자체가 실패함.
-- reported_content_snapshot 유무로 "원래 댓글 신고였는지"를 추가로 구분해서 해결.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

DROP INDEX IF EXISTS public.reports_reporter_post_unique;

CREATE UNIQUE INDEX IF NOT EXISTS reports_reporter_post_unique
  ON public.reports (reporter_id, post_id)
  WHERE comment_id IS NULL AND reported_content_snapshot IS NULL;
