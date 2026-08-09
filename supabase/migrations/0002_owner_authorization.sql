-- Exposes only the current caller's owner status. The allowlisted email remains
-- in the private schema and is never returned through the Data API.
create function public.is_media_studio_owner()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select private.is_media_owner();
$$;

revoke all on function public.is_media_studio_owner() from public;
grant execute on function public.is_media_studio_owner() to anon, authenticated;
