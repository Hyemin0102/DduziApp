-- 광고 노출 여부를 원격으로 켜고 끄기 위한 설정 테이블. 앱 코드에는 광고
-- 컴포넌트가 그대로 남아있지만, 여기 ads_enabled를 false로 바꾸면 앱 재배포 없이
-- 즉시 모든 네이티브 광고가 렌더링을 멈춤 (정책 위반/사용자 불만 등 긴급 상황 대응용)
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.app_ads_config (
  key text PRIMARY KEY DEFAULT 'global',
  ads_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_ads_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app ads config" ON public.app_ads_config
FOR SELECT TO public
USING (true);

INSERT INTO public.app_ads_config (key, ads_enabled)
VALUES ('global', true)
ON CONFLICT (key) DO NOTHING;
