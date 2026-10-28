-- Deploy before the application that reads public_studio_documents.
begin;
alter table public.studio_documents add column if not exists is_deleted boolean not null default false;
-- Existing documents were serialized by gray-matter with this frontmatter key.
update public.studio_documents
set is_deleted = coalesce(
  substring(document from E'(?s)\\A---\\r?\\n(.*?)\\r?\\n---(?:\\r?\\n|$)')
    ~ E'(?n)^studioDeleted:[ \\t]*true[ \\t\\r]*$', false);

drop policy if exists "Published Studio documents are readable" on public.studio_documents;
create policy "Owner reads complete Studio documents"
  on public.studio_documents for select to authenticated
  using (public.is_media_studio_owner());
revoke select on public.studio_documents from anon;

-- Deliberately owner-executed projection: the base table is owner-only. The
-- explicit CASE is the public boundary. A tombstone prevents repository fallback
-- without disclosing the recycled title, body, artwork or other metadata.
create or replace view public.public_studio_documents
with (security_barrier = true, security_invoker = false) as
select collection, slug,
  case when is_deleted then
    E'---\ntitle: Removed\ndescription: Removed\ndate: "1970-01-01"\ntags: []\nslug: ' || slug || E'\nstudioDeleted: true\n---\n'
  else document end as document
from public.studio_documents;
revoke all on public.public_studio_documents from public;
grant select on public.public_studio_documents to anon, authenticated;
commit;
