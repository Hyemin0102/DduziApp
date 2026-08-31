-- 뜨개함 기능: 사용자가 저장한 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.saved_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved projects"
  ON public.saved_projects FOR ALL
  USING (auth.uid() = user_id);

-- 저장한 비공개 프로젝트를 뜨개함에서 볼 수 있도록 허용
CREATE POLICY "Users can view projects they saved"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_projects
      WHERE saved_projects.project_id = projects.id
        AND saved_projects.user_id = auth.uid()
    )
  );
