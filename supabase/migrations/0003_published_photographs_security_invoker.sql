-- Existing deployments created this public projection as a SECURITY DEFINER
-- view. Make it use the querying role and its RLS policies instead.
alter view public.published_photographs
  set (security_invoker = true);
