-- 같은 게시물을 같은 유저가 중복 신고하는 것을 DB 레벨에서 방지
-- 적용 방법: Supabase Dashboard → SQL Editor에 붙여넣어 실행

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_post_unique UNIQUE (reporter_id, post_id);
