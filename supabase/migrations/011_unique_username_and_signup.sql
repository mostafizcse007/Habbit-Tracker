-- Enforce unique username on profiles (case-insensitive)
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(trim(username)))
  where username is not null;

-- Function to safely check if a username is available for registration
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

-- Update handle_new_user trigger function to read username and full_name from metadata
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
