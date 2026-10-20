-- ============================================================
-- 1. Notes & Tags (Safe / Idempotent)
-- ============================================================
alter table public.habits
  add column if not exists tags text[] not null default '{}';

create index if not exists habits_tags_idx on public.habits using gin (tags);

alter table public.habit_logs
  add column if not exists note text check (char_length(note) <= 500);

-- ============================================================
-- 2. Delete User Account Function (for Profile Settings)
-- ============================================================
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;

-- ============================================================
-- 3. Unique Username & Profile Sync on Signup
-- ============================================================
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(trim(username)))
  where username is not null;

create or replace function public.check_username_available(check_username text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if check_username is null or trim(check_username) = '' then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles
    where lower(trim(username)) = lower(trim(check_username))
  );
end;
$$;

revoke execute on function public.check_username_available(text) from public;
grant execute on function public.check_username_available(text) to anon, authenticated;

-- Automatically populate username and full_name in public.profiles when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_username text;
  raw_full_name text;
begin
  raw_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );
  raw_full_name := nullif(trim(new.raw_user_meta_data->>'full_name'), '');

  insert into public.profiles (id, username, full_name)
  values (new.id, raw_username, raw_full_name)
  on conflict (id) do update
    set username = coalesce(excluded.username, profiles.username),
        full_name = coalesce(excluded.full_name, profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
