create table public.weekly_reviews (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_end date not null,
  content text not null check (char_length(content) between 1 and 4000),
  generations smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_end)
);

alter table public.weekly_reviews enable row level security;

create policy "reviews select own" on public.weekly_reviews
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reviews insert own" on public.weekly_reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "reviews update own" on public.weekly_reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));