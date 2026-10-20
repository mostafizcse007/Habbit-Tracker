-- Migration: 015_achievements_reconciliation.sql
-- Allow authenticated users to delete their own user_achievements rows for badge reconciliation
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_achievements'
      and policyname = 'achievements delete own'
  ) then
    create policy "achievements delete own" on public.user_achievements
      for delete to authenticated
      using (user_id = (select auth.uid()));
  end if;
end $$;
