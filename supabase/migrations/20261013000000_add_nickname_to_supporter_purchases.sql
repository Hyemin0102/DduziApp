-- supporter_purchases 테이블에서 SQL Editor로 조회할 때 user_id(uuid)만으로는
-- 누군지 알아보기 어려워서, 구매 시점의 닉네임을 같이 저장해둠(조회 편의용 스냅샷 —
-- 나중에 유저가 닉네임을 바꿔도 이 값은 안 바뀜, 신고 테이블의 스냅샷과 같은 패턴)
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.supporter_purchases ADD COLUMN IF NOT EXISTS nickname text;

CREATE OR REPLACE FUNCTION public.set_supporter_purchase_nickname()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT nickname INTO NEW.nickname FROM public.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_supporter_purchase_nickname ON public.supporter_purchases;
CREATE TRIGGER trg_set_supporter_purchase_nickname
BEFORE INSERT ON public.supporter_purchases
FOR EACH ROW EXECUTE FUNCTION public.set_supporter_purchase_nickname();

-- 이미 들어있는 기존 행(테스트 데이터 등)도 소급 반영
UPDATE public.supporter_purchases sp
SET nickname = u.nickname
FROM public.users u
WHERE sp.user_id = u.id AND sp.nickname IS NULL;
