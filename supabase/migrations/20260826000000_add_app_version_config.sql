-- 앱 실행 시 버전을 비교해 업데이트 모달을 띄우기 위한 설정 테이블
-- min_supported_version보다 낮으면 항상 닫을 수 없는 강제 업데이트 모달을 띄움.
-- latest_version보다 낮다고 무조건 안내 모달이 뜨는 건 아니고, show_update_modal이
-- true일 때만 뜸 — 사소한 릴리즈는 latest_version만 올리고 굳이 안내 안 띄우고,
-- 꼭 알리고 싶은 업데이트만 show_update_modal을 true로 켜서 사용
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

CREATE TABLE IF NOT EXISTS public.app_version_config (
  platform text PRIMARY KEY CHECK (platform IN ('ios', 'android')),
  latest_version text NOT NULL,
  min_supported_version text NOT NULL,
  show_update_modal boolean NOT NULL DEFAULT false,
  release_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_version_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app version config" ON public.app_version_config
FOR SELECT TO public
USING (true);

-- 현재 스토어 배포 버전으로 초기값 세팅 (이번 릴리즈에선 아무도 모달을 안 보게 됨 —
-- 다음 버전을 낼 때 여기 latest_version만 올려주면 됨)
INSERT INTO public.app_version_config (platform, latest_version, min_supported_version)
VALUES
  ('ios', '1.0.3', '1.0.3'),
  ('android', '1.0.3', '1.0.3')
ON CONFLICT (platform) DO NOTHING;
