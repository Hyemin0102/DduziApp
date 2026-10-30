-- 기존 (reporter_id, post_id) 유니크 제약은 게시물 신고와 댓글 신고를 구분하지 않아서,
-- 한 게시물에서 게시물 1번 + 댓글 여러 개를 각각 신고하는 게 불가능했음(두 번째부터
-- "이미 신고했습니다"로 막힘). comment_id 유무로 분리해서 각각 따로 중복 체크되게 함.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_post_unique;

-- 게시물 신고: comment_id가 없는(=게시물 자체 신고) 행에 한해 유저당 게시물 1건만
CREATE UNIQUE INDEX IF NOT EXISTS reports_reporter_post_unique
  ON public.reports (reporter_id, post_id)
  WHERE comment_id IS NULL;

-- 댓글 신고: 유저당 같은 댓글은 1건만 (같은 게시물의 다른 댓글/게시물 자체는 별개로 신고 가능)
CREATE UNIQUE INDEX IF NOT EXISTS reports_reporter_comment_unique
  ON public.reports (reporter_id, comment_id)
  WHERE comment_id IS NOT NULL;
