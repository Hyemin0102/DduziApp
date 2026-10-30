-- 댓글 속도 제한 조정: 활발한 유저가 여러 게시물에 걸쳐 활동하면 전체 합산
-- 1시간 30개 상한에 금방 닿을 수 있어서, 합산 상한은 넉넉하게 올리고 대신
-- "게시물 하나당" 도배를 막는 상한을 새로 추가함.
-- - 1분 5개(기존 유지, 순간 폭주 방지)
-- - 전체 합산 1시간 30개 -> 80개(상향, 정상적인 멀티 게시물 활동은 거의 안 닿음)
-- - 게시물 하나당(같은 유저 기준) 1시간 30개(신규, 특정 게시물 집중 도배 방지)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE INDEX IF NOT EXISTS comments_user_post_created_idx
  ON public.comments (user_id, post_id, created_at);

CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS trigger AS $$
DECLARE
  recent_minute_count integer;
  recent_hour_count integer;
  recent_post_hour_count integer;
BEGIN
  SELECT count(*) INTO recent_minute_count
  FROM public.comments
  WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute';

  IF recent_minute_count >= 5 THEN
    RAISE EXCEPTION '댓글을 너무 빨리 작성하고 있어요. 잠시 후 다시 시도해주세요.';
  END IF;

  SELECT count(*) INTO recent_hour_count
  FROM public.comments
  WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour';

  IF recent_hour_count >= 80 THEN
    RAISE EXCEPTION '1시간 동안 작성할 수 있는 댓글 수를 초과했어요. 잠시 후 다시 시도해주세요.';
  END IF;

  SELECT count(*) INTO recent_post_hour_count
  FROM public.comments
  WHERE user_id = NEW.user_id AND post_id = NEW.post_id
    AND created_at > now() - interval '1 hour';

  IF recent_post_hour_count >= 30 THEN
    RAISE EXCEPTION '이 게시물에 1시간 동안 작성할 수 있는 댓글 수를 초과했어요. 잠시 후 다시 시도해주세요.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
