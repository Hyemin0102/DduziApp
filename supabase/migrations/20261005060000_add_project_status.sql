-- 프로젝트 상태에 "예정"(아직 안 시작, 신규 생성 기본값) 추가.
-- is_completed 불리언은 그대로 두고(기존 읽기 지점 다수라 안 건드림), status에서
-- 트리거로 항상 파생시켜 동기화 — 클라이언트는 이제 status만 보내면 됨.
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planned';
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('planned', 'in_progress', 'completed'));

-- 기존 프로젝트는 이미 진행됐던 것들이라 'planned'로 되돌리면 안 됨 — is_completed 기준으로 백필
UPDATE public.projects
SET status = CASE WHEN is_completed THEN 'completed' ELSE 'in_progress' END;

-- 기존 20260903000000_project_date_defaults.sql의 set_completed_at_on_complete()/
-- trg_set_completed_at(UPDATE 전용)를 대체 — is_completed 동기화 + completed_at
-- 자동 채움을 INSERT/UPDATE 양쪽에서 처리
CREATE OR REPLACE FUNCTION public.sync_project_status_fields()
RETURNS trigger AS $$
BEGIN
  -- 신규 앱 스토어 배포 전까지는 구버전 앱이 status를 모른 채 is_completed만
  -- 직접 바꿀 수 있어서, 양방향으로 동기화함:
  -- - status가 안 바뀌었는데 is_completed만 바뀜 -> 구버전 앱 -> status를 역산
  -- - 그 외(status가 바뀌었거나 INSERT) -> 신버전 앱 기준 -> is_completed를 파생
  IF TG_OP = 'UPDATE'
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.is_completed IS DISTINCT FROM OLD.is_completed THEN
    NEW.status := CASE WHEN NEW.is_completed THEN 'completed' ELSE 'in_progress' END;
  ELSE
    NEW.is_completed := (NEW.status = 'completed');
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := current_date;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := current_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_completed_at ON public.projects;
DROP TRIGGER IF EXISTS trg_sync_project_status ON public.projects;
CREATE TRIGGER trg_sync_project_status
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.sync_project_status_fields();
