-- 후원 횟수를 users 테이블에 함께 보관 (등급과 같은 출처에서 읽도록 통일)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 이미 적용된 20261006000000 마이그레이션을 수정하지 않고 변경분만 추가함

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supporter_count integer NOT NULL DEFAULT 0
  CHECK (supporter_count >= 0);

-- 횟수와 등급 모두 서버만 바꿀 수 있도록 변조 방지 대상에 supporter_count 추가
CREATE OR REPLACE FUNCTION public.guard_supporter_level()
RETURNS trigger AS $$
BEGIN
  IF (NEW.supporter_level IS DISTINCT FROM OLD.supporter_level
      OR NEW.supporter_count IS DISTINCT FROM OLD.supporter_count)
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'supporter level/count can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 유효(active) 후원 횟수를 세서 횟수와 등급을 함께 갱신
CREATE OR REPLACE FUNCTION public.refresh_supporter_level(p_user_id uuid)
RETURNS void AS $$
DECLARE
  active_count integer;
BEGIN
  SELECT count(*) INTO active_count
  FROM public.supporter_purchases
  WHERE user_id = p_user_id AND status = 'active';

  UPDATE public.users
  SET supporter_count = active_count,
      supporter_level = CASE
        WHEN active_count >= 3 THEN 3
        WHEN active_count = 2 THEN 2
        WHEN active_count = 1 THEN 1
        ELSE NULL
      END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
