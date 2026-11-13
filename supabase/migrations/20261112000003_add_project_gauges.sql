-- 프로젝트 게이지: 내가 실제로 뜬 게이지 (실의 권장 게이지와 별개)
-- 한 프로젝트에 여러 개 가능 (예: 몸판 메리야스 / 소매 무늬). 기준은 10cm 고정
-- 공개 프로젝트면 다른 사용자도 조회 가능 — 뜨개 로그와 같은 공개/차단 규칙

CREATE TABLE IF NOT EXISTS public.project_gauges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stitches NUMERIC(5, 1) NOT NULL CHECK (stitches > 0),        -- 코수 / 10cm (필수)
  rows NUMERIC(5, 1) CHECK (rows IS NULL OR rows > 0),          -- 단수 / 10cm
  needle_mm NUMERIC(4, 2) CHECK (needle_mm IS NULL OR needle_mm > 0),  -- 사용한 바늘
  pattern TEXT,                                                 -- 무늬 (메리야스, 고무단 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_gauges_project_id_idx
  ON public.project_gauges (project_id, created_at);

ALTER TABLE public.project_gauges ENABLE ROW LEVEL SECURITY;

-- 내 프로젝트의 게이지만 추가/수정/삭제
CREATE POLICY "Users can manage own project gauges"
  ON public.project_gauges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- 공개 프로젝트의 게이지는 누구나 조회 (차단 관계 제외)
CREATE POLICY "Anyone can view public project gauges"
  ON public.project_gauges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_gauges.project_id
        AND p.visibility = 'public'
        AND NOT public.is_blocked_either_way(auth.uid(), p.user_id)
    )
  );
