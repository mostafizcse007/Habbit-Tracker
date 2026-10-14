create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null default '#6366f1',
  frequency smallint[] not null default '{0,1,2,3,4,5,6}',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index habits_user_idx on public.habits (user_id);
create index habit_logs_user_date_idx on public.habit_logs (user_id, completed_on desc);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

create policy "profiles select own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "habits all own" on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "logs all own" on public.habit_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = (select auth.uid())
    )
  );

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();