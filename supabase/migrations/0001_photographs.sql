-- Owner Media Studio: private source files, private derivatives, and publication metadata.
-- The owner email is intentionally not embedded here. Follow README.md after applying
-- this migration to add it to private.media_studio_settings from the Supabase SQL editor.

create type public.photograph_status as enum ('draft', 'published');

create table public.photographs (
  id uuid primary key default gen_random_uuid(),
  original_path text not null,
  thumbnail_path text,
  gallery_path text,
  detail_path text,
  title text,
  alt text,
  caption text,
  captured_at date,
  location text,
  category text,
  display_order integer not null default 0,
  crop jsonb not null default '{}'::jsonb,
  status public.photograph_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint photographs_published_requires_metadata check (
    status = 'draft'
    or (
      nullif(btrim(title), '') is not null
      and nullif(btrim(alt), '') is not null
      and thumbnail_path is not null
      and gallery_path is not null
      and detail_path is not null
      and published_at is not null
    )
  ),
  constraint photographs_draft_has_no_published_at check (
    status = 'published' or published_at is null
  )
);

create index photographs_publication_order_idx
  on public.photographs (display_order asc, published_at desc)
  where status = 'published';

create schema if not exists private;

-- This table has no grants for anon/authenticated users. Keeping the allowlist in
-- private avoids exposing the owner email through public data APIs.
create table private.media_studio_settings (
  singleton boolean primary key default true check (singleton),
  owner_email text not null check (owner_email = lower(owner_email) and btrim(owner_email) <> '')
);

revoke all on table private.media_studio_settings from anon, authenticated;

create function private.is_media_owner()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select exists (
    select 1
    from private.media_studio_settings
    where singleton
      and owner_email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function private.is_media_owner() from public;
grant execute on function private.is_media_owner() to anon, authenticated;

alter table public.photographs enable row level security;

create policy "Owner can read every photograph"
  on public.photographs
  for select
  to authenticated
  using (private.is_media_owner());

create policy "Owner can create photographs"
  on public.photographs
  for insert
  to authenticated
  with check (private.is_media_owner());

create policy "Owner can update photographs"
  on public.photographs
  for update
  to authenticated
  using (private.is_media_owner())
  with check (private.is_media_owner());

create policy "Owner can delete photographs"
  on public.photographs
  for delete
  to authenticated
  using (private.is_media_owner());

-- Anonymous clients must never read public.photographs directly: that row
-- includes original_path and internal curatorial fields. This view is the sole
-- public data boundary and intentionally exposes only published derivatives and
-- display metadata. SECURITY INVOKER ensures callers never inherit the view
-- owner's privileges or bypass the base table's RLS policies.
create view public.published_photographs
with (security_barrier = true, security_invoker = true)
as
select
  id,
  thumbnail_path,
  gallery_path,
  detail_path,
  title,
  alt,
  caption,
  captured_at,
  location,
  category,
  display_order,
  published_at
from public.photographs
where status = 'published';

revoke all on public.published_photographs from public;
grant select on public.published_photographs to anon, authenticated;

-- Both buckets are private. Public pages receive derivative URLs from server code;
-- originals never receive browser-readable URLs.
insert into storage.buckets (id, name, public)
values ('originals', 'originals', false), ('derivatives', 'derivatives', false)
on conflict (id) do update set public = excluded.public;

create policy "Owner can read media objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('originals', 'derivatives')
    and private.is_media_owner()
  );

create policy "Owner can upload media objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('originals', 'derivatives')
    and private.is_media_owner()
  );

create policy "Owner can update media objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('originals', 'derivatives')
    and private.is_media_owner()
  )
  with check (
    bucket_id in ('originals', 'derivatives')
    and private.is_media_owner()
  );

create policy "Owner can delete media objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('originals', 'derivatives')
    and private.is_media_owner()
  );
