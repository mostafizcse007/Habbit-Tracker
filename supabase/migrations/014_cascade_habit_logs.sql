-- Migration: 014_cascade_habit_logs.sql
-- 1. Clean up orphaned habit_logs whose parent habit no longer exists
delete from public.habit_logs
where habit_id not in (select id from public.habits);

-- 2. Ensure foreign key constraint from habit_logs to habits has ON DELETE CASCADE
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'habit_logs_habit_id_fkey'
  ) then
    alter table public.habit_logs
      drop constraint habit_logs_habit_id_fkey;
  end if;

  alter table public.habit_logs
    add constraint habit_logs_habit_id_fkey
    foreign key (habit_id)
    references public.habits(id)
    on delete cascade;
end $$;
