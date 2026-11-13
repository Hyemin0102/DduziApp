-- 서랍장 > 실: 사용자가 가진 실 목록 + 실-프로젝트 연결
-- 레이블리에서 가져온 값은 저장 시점에 복사해두고(사용자가 수정 가능), ravelry_yarn_id로 원본을 추적함
-- 실 1행 = 색상 1개 + LOT 1개 (같은 실이라도 색상/LOT가 다르면 별도 행)

-- ── 실 테이블 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_yarns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보 (필수는 name만)
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  brand TEXT,                -- 레이블리 yarn_company_name
  color TEXT,                -- 사용자 입력 (레이블리에 없음)
  lot TEXT,                  -- 염색 번호, 사용자 입력
  ply TEXT,                  -- 합수. 레이블리 yarn_weight.ply는 굵기 등급 표준값이라 실제와 다를 수 있음 → 사용자 수정 전제
  fiber TEXT,                -- 성분 표시용 문자열 (레이블리 yarn_fibers → "Merino 100%")
  gauge TEXT,                -- 게이지 표시용 문자열 (레이블리 min/max_gauge + gauge_divisor → "29코 / 10cm")
  needle_size TEXT,          -- 권장 바늘 (레이블리 min/max_needle_size.metric → "2.5–3.5mm")

  -- 수량 (남은 양은 이번 범위에서 제외)
  ball_count INTEGER CHECK (ball_count IS NULL OR ball_count >= 0),                         -- 구매량(볼 수)
  grams_per_ball NUMERIC(7, 1) CHECK (grams_per_ball IS NULL OR grams_per_ball > 0),        -- 레이블리 grams
  meters_per_ball NUMERIC(8, 1) CHECK (meters_per_ball IS NULL OR meters_per_ball > 0),     -- 레이블리 yardage × 0.9144

  -- 구매 정보
  purchase_place TEXT,
  purchased_at DATE,
  price INTEGER CHECK (price IS NULL OR price >= 0),  -- 원 단위

  memo TEXT,

  -- 이미지: 업로드한 사진(custom_image_url)이 있으면 우선 표시, 없으면 레이블리 사진
  custom_image_url TEXT,
  ravelry_image_url TEXT,

  -- 레이블리 원본 추적용 (직접 입력한 실은 NULL)
  ravelry_yarn_id INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_yarns_user_id_created_at_idx
  ON public.user_yarns (user_id, created_at DESC);

CREATE OR REPLACE TRIGGER update_user_yarns_updated_at
  BEFORE UPDATE ON public.user_yarns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_yarns ENABLE ROW LEVEL SECURITY;

-- 서랍장은 본인만 조회/관리 (다른 사용자에게 공개하지 않음)
CREATE POLICY "Users can manage own yarns"
  ON public.user_yarns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 실-프로젝트 연결 테이블 ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_yarn_projects (
  yarn_id UUID NOT NULL REFERENCES public.user_yarns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (yarn_id, project_id)
);

-- 프로젝트 상세에서 "사용한 실" 역조회용
CREATE INDEX IF NOT EXISTS user_yarn_projects_project_id_idx
  ON public.user_yarn_projects (project_id);

ALTER TABLE public.user_yarn_projects ENABLE ROW LEVEL SECURITY;

-- 내 실 + 내 프로젝트끼리만 연결/조회/해제 가능
CREATE POLICY "Users can manage own yarn-project links"
  ON public.user_yarn_projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_yarns y WHERE y.id = yarn_id AND y.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_yarns y WHERE y.id = yarn_id AND y.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- ── 실 사진 Storage 버킷 ──────────────────────────────────
-- 경로 규칙: yarn-images/{user_id}/{파일명} — 첫 폴더가 본인 user_id일 때만 업로드/수정/삭제 허용
INSERT INTO storage.buckets (id, name, public)
VALUES ('yarn-images', 'yarn-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own yarn images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'yarn-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own yarn images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'yarn-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own yarn images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'yarn-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
