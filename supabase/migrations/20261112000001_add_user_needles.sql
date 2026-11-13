-- 서랍장 > 바늘: 사용자가 가진 바늘 목록 (직접 입력만)
-- 단품/세트를 한 행으로 관리: 세트는 호수/케이블 길이를 배열로 여러 개 저장, 단품은 1개짜리 배열
-- 호수는 한국식/일본식/US 표기가 섞여 있어 mm로만 저장하고, 화면에서 호수 변환표를 보여줌

CREATE TABLE IF NOT EXISTS public.user_needles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 종류 / 모양 (필수)
  category TEXT NOT NULL CHECK (category IN ('knitting', 'crochet')),  -- 대바늘 / 코바늘
  needle_type TEXT NOT NULL CHECK (
    needle_type IN (
      'circular',        -- 줄바늘 (고정식)
      'interchangeable', -- 조립식 (교체형 팁 + 케이블)
      'dpn',             -- 장갑바늘
      'straight',        -- 막대바늘
      'crochet',         -- 코바늘
      'tunisian'         -- 아후강
    )
  ),
  is_set BOOLEAN NOT NULL DEFAULT false,  -- 단품 / 세트

  -- 이름은 선택: 비어 있으면 화면에서 "브랜드 4mm 줄바늘 80cm"처럼 자동 생성
  name TEXT,
  brand TEXT,

  -- 호수(mm): 1개 이상 필수. 단품은 정확히 1개
  sizes_mm NUMERIC(4, 2)[] NOT NULL CHECK (cardinality(sizes_mm) >= 1),
  -- 케이블 길이(cm): 줄바늘/조립식/아후강에서 사용, 선택
  cable_lengths_cm INTEGER[] NOT NULL DEFAULT '{}',

  -- 구매 정보
  purchase_place TEXT,
  purchased_at DATE,
  price INTEGER CHECK (price IS NULL OR price >= 0),  -- 원 단위

  memo TEXT,
  image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 단품은 호수/케이블 길이를 각각 최대 1개만
  CONSTRAINT user_needles_single_check CHECK (
    is_set
    OR (
      cardinality(sizes_mm) = 1
      AND cardinality(cable_lengths_cm) <= 1
    )
  )
);

CREATE INDEX IF NOT EXISTS user_needles_user_id_created_at_idx
  ON public.user_needles (user_id, created_at DESC);

CREATE OR REPLACE TRIGGER update_user_needles_updated_at
  BEFORE UPDATE ON public.user_needles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_needles ENABLE ROW LEVEL SECURITY;

-- 서랍장은 본인만 조회/관리
CREATE POLICY "Users can manage own needles"
  ON public.user_needles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 바늘 사진 Storage 버킷 ────────────────────────────────
-- 경로 규칙: needle-images/{user_id}/{파일명}
INSERT INTO storage.buckets (id, name, public)
VALUES ('needle-images', 'needle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own needle images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'needle-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own needle images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'needle-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own needle images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'needle-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── 바늘-프로젝트 연결 테이블 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_needle_projects (
  needle_id UUID NOT NULL REFERENCES public.user_needles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (needle_id, project_id)
);

-- 프로젝트 상세에서 "사용한 바늘" 역조회용
CREATE INDEX IF NOT EXISTS user_needle_projects_project_id_idx
  ON public.user_needle_projects (project_id);

ALTER TABLE public.user_needle_projects ENABLE ROW LEVEL SECURITY;

-- 내 바늘 + 내 프로젝트끼리만 연결/조회/해제 가능
CREATE POLICY "Users can manage own needle-project links"
  ON public.user_needle_projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_needles n WHERE n.id = needle_id AND n.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_needles n WHERE n.id = needle_id AND n.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );
