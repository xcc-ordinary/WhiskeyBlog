-- Studio saves publish immediately. Only the owner may create/change content.
-- Existing repository MDX remains the fallback until a matching cloud row is saved.
begin;
create table if not exists public.studio_documents (
  collection text not null check (collection in ('posts', 'projects')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  document text not null check (length(document) between 1 and 250000),
  updated_at timestamptz not null default now(),
  primary key (collection, slug)
);
alter table public.studio_documents enable row level security;
grant select on public.studio_documents to anon, authenticated;
grant insert, update on public.studio_documents to authenticated;
do $$ begin
if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studio_documents' and policyname = 'Published Studio documents are readable') then
create policy "Published Studio documents are readable"
  on public.studio_documents for select to anon, authenticated using (true);
end if;
if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studio_documents' and policyname = 'Owner creates Studio documents') then
create policy "Owner creates Studio documents"
  on public.studio_documents for insert to authenticated
  with check (public.is_media_studio_owner());
end if;
if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studio_documents' and policyname = 'Owner edits Studio documents') then
create policy "Owner edits Studio documents"
  on public.studio_documents for update to authenticated
  using (public.is_media_studio_owner()) with check (public.is_media_studio_owner());
end if;
end $$;

-- Public project/blog illustrations only; private photographs remain separate.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-images', 'content-images', true, 3932160, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
do $$ begin
if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Owner uploads content illustrations') then
create policy "Owner uploads content illustrations"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-images' and public.is_media_studio_owner());
end if;
end $$;
commit;
