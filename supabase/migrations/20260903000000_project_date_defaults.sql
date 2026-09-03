-- 구버전 클라이언트(started_at/completed_at을 아예 안 보내는 버전)가 여전히 남아있어서
-- INSERT/완료 처리 시 이 두 컬럼이 계속 NULL로 남는 문제를 DB 레벨에서 방지
--
-- 적용 방법: dduzi(aaeqoryqxtkcovplmpyx)와 dduzi_prod(xjqrqnlhejslenaagnel)
-- 두 프로젝트의 Supabase Dashboard SQL Editor에 각각 붙여넣어 실행

-- 1) started_at: INSERT 시 값이 없으면 오늘 날짜로 자동 채움
alter table public.projects alter column started_at set default current_date;

-- 2) completed_at: is_completed가 false -> true로 바뀌는 순간, 비어있으면 오늘 날짜로 채움
--    (완료 안 한 프로젝트는 계속 null이어야 정상이라 DEFAULT 대신 트리거 사용)
create or replace function public.set_completed_at_on_complete()
returns trigger as $$
begin
  if new.is_completed = true and old.is_completed = false and new.completed_at is null then
    new.completed_at := current_date;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_completed_at on public.projects;
create trigger trg_set_completed_at
before update on public.projects
for each row
execute function public.set_completed_at_on_complete();
