-- Function allowing authenticated users to delete their own account and all associated data
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

  -- Delete user from auth.users.
  -- All tables (profiles, habits, habit_logs, weekly_reviews, user_achievements)
  -- have 'references auth.users(id) on delete cascade' and will automatically be cleaned up.
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;
