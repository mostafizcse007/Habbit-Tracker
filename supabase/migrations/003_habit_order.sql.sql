alter table public.habits
  add column sort_order integer not null default 0;

update public.habits h
set sort_order = r.rn
from (
  select id, row_number() over (partition by user_id order by created_at, id) as rn
  from public.habits
) r
where h.id = r.id;

create index habits_user_sort_idx on public.habits (user_id, sort_order);

create function public.reorder_habits(habit_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.habits h
  set sort_order = o.ord
  from unnest(habit_ids) with ordinality as o(id, ord)
  where h.id = o.id
    and h.user_id = (select auth.uid());
$$;

revoke execute on function public.reorder_habits(uuid[]) from public, anon;
grant execute on function public.reorder_habits(uuid[]) to authenticated;