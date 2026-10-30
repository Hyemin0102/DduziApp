-- 앱 후원(응원) 기능 테이블
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행
-- 구매/환불 기록은 Edge Function(service_role)만 쓰고, 클라이언트는 읽기만 함

-- 1) 응원 거래 기록 (스토어 영수증 검증 후 service_role이 insert, 환불 웹훅이 status 변경)
CREATE TABLE IF NOT EXISTS public.supporter_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  store text NOT NULL CHECK (store IN ('app_store', 'google_play')),
  product_id text NOT NULL,
  transaction_id text NOT NULL,
  price_krw integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded')),
  purchased_at timestamptz NOT NULL,
  refunded_at timestamptz,
  store_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store, transaction_id)
);

CREATE INDEX IF NOT EXISTS supporter_purchases_user_active_idx
  ON public.supporter_purchases (user_id)
  WHERE status = 'active';

ALTER TABLE public.supporter_purchases ENABLE ROW LEVEL SECURITY;

-- 본인 기록만 조회 가능 (횟수/환불 여부 확인용). insert/update/delete 정책은 없음 → service_role 전용
CREATE POLICY "Users can view own supporter purchases" ON public.supporter_purchases
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2) 유저 테이블에 뱃지 관련 컬럼 추가
-- supporter_level: 1(1회) / 2(2회) / 3(3회 이상), NULL이면 뱃지 없음. 공개 조회 가능하지만 값은 서버만 바꿈
-- show_supporter_badge: 사용자가 마이페이지에서 켜고 끄는 공개 설정
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supporter_level smallint
  CHECK (supporter_level BETWEEN 1 AND 3);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS show_supporter_badge boolean NOT NULL DEFAULT false;

-- "Users can update own data" 정책 때문에 클라이언트가 supporter_level를 직접 바꿀 수 있으므로
-- service_role이 아닌 요청에서는 supporter_level 변경을 막음
CREATE OR REPLACE FUNCTION public.guard_supporter_level()
RETURNS trigger AS $$
BEGIN
  IF NEW.supporter_level IS DISTINCT FROM OLD.supporter_level
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'supporter_level can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_supporter_level ON public.users;
CREATE TRIGGER trg_guard_supporter_level
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_supporter_level();

-- 3) 유효(active) 후원 횟수로 뱃지 등급 재계산
-- 구매 insert/환불 update 시마다 호출되어 users.supporter_level를 항상 맞춤
CREATE OR REPLACE FUNCTION public.refresh_supporter_level(p_user_id uuid)
RETURNS void AS $$
DECLARE
  active_count integer;
BEGIN
  SELECT count(*) INTO active_count
  FROM public.supporter_purchases
  WHERE user_id = p_user_id AND status = 'active';

  UPDATE public.users
  SET supporter_level = CASE
    WHEN active_count >= 3 THEN 3
    WHEN active_count = 2 THEN 2
    WHEN active_count = 1 THEN 1
    ELSE NULL
  END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_supporter_level_on_purchase()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.refresh_supporter_level(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supporter_level ON public.supporter_purchases;
CREATE TRIGGER trg_sync_supporter_level
AFTER INSERT OR UPDATE OF status ON public.supporter_purchases
FOR EACH ROW EXECUTE FUNCTION public.sync_supporter_level_on_purchase();

-- 4) 앱 접속 기록 (하루 1회, KST 기준 날짜로 유니크)
-- 누적 접속 횟수와 "기능 버전 처음 실행한 일자"(app_version 기준 최초 행)를 여기서 계산
CREATE TABLE IF NOT EXISTS public.app_opens (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opened_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Seoul')::date),
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opened_on)
);

ALTER TABLE public.app_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own app opens" ON public.app_opens
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can record own app opens" ON public.app_opens
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5) 응원 유도 모달 노출 기록 (1차/2차/3차 판단용)
CREATE TABLE IF NOT EXISTS public.support_modal_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stage smallint NOT NULL CHECK (stage IN (1, 2, 3)),
  shown_at timestamptz NOT NULL DEFAULT now(),
  tapped_at timestamptz
);

CREATE INDEX IF NOT EXISTS support_modal_logs_user_idx
  ON public.support_modal_logs (user_id, shown_at DESC);

ALTER TABLE public.support_modal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support modal logs" ON public.support_modal_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can record own support modal logs" ON public.support_modal_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support modal logs" ON public.support_modal_logs
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
