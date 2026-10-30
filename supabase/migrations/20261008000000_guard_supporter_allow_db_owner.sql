-- 등급/횟수 변조 방지 트리거가 DB 소유자 권한의 서버 함수(refresh_supporter_level, SECURITY DEFINER)에서도
-- 통과되도록 수정. 클라이언트(authenticated/anon)는 current_user가 DB 소유자가 아니므로 여전히 막힘.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE OR REPLACE FUNCTION public.guard_supporter_level()
RETURNS trigger AS $$
BEGIN
  IF (NEW.supporter_level IS DISTINCT FROM OLD.supporter_level
      OR NEW.supporter_count IS DISTINCT FROM OLD.supporter_count)
     AND auth.role() IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'supporter level/count can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
