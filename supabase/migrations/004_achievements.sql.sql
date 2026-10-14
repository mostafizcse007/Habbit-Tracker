create table public.user_achievements (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null check (char_length(key) between 1 and 50),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_achievements enable row level security;

create policy "achievements select own" on public.user_achievements
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "achievements insert own" on public.user_achievements
  for insert to authenticated
  with check (user_id = (select auth.uid()));