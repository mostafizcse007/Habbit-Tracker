create or replace function public.seed_demo_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise exception 'Demo data is only for demo accounts';
  end if;

  if exists (select 1 from public.habits where user_id = uid) then
    return;
  end if;

  insert into public.habits (name, color, frequency, icon, sort_order, created_at)
  values
    ('Solve 2 coding problems', '#F97316', '{0,1,2,3,4,5,6}', 'code', 1, now() - interval '100 days'),
    ('Read 20 pages', '#8B5CF6', '{0,1,2,3,4,5,6}', 'book-open', 2, now() - interval '100 days'),
    ('Workout', '#10B981', '{1,3,5}', 'dumbbell', 3, now() - interval '100 days'),
    ('Revise today''s notes', '#EF4444', '{1,2,3,4,5}', 'pencil', 4, now() - interval '100 days'),
    ('Sleep before 11:30', '#3B82F6', '{0,1,2,3,4,5,6}', 'moon', 5, now() - interval '100 days'),
    ('Meditate for 10 minutes', '#06B6D4', '{0,1,2,3,4,5,6}', 'leaf', 6, now() - interval '100 days');

  insert into public.habit_logs (habit_id, completed_on)
  select h.id, d::date
  from public.habits h
  cross join generate_series(current_date - 89, current_date - 1, interval '1 day') as d
  where h.user_id = uid
    and extract(dow from d)::int = any (h.frequency::int[])
    and (
      (abs(hashtext(h.id::text || d::text)) % 100) / 100.0
        < least(
            0.97,
            (case h.sort_order when 1 then 0.62 when 2 then 0.55 when 3 then 0.7 when 4 then 0.6 when 5 then 0.5 else 0.45 end)
              + 0.3 * ((d::date - (current_date - 89)) / 89.0)
          )
      or (h.sort_order = 1 and d::date >= current_date - 8)
      or (h.sort_order = 2 and d::date >= current_date - 3)
    );

  update public.profiles
  set full_name = 'Demo',
      username = 'demo_' || substr(replace(uid::text, '-', ''), 1, 6)
  where id = uid;
end;
$$;

revoke execute on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;

drop policy "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
  );