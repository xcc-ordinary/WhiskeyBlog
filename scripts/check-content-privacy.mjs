// Run against disposable embedded PostgreSQL, never a production database.
// Usage: node scripts/check-content-privacy.mjs <absolute path to @electric-sql/pglite>
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.argv[2] ?? "@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (bucket_id text);
    create function public.is_media_studio_owner() returns boolean language sql stable
      as $$ select coalesce(current_setting('test.owner', true), '') = 'yes' $$;
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/0004_studio_documents.sql", import.meta.url), "utf8"));
  const active = '---\ntitle: Live\ndescription: Public\ndate: "2026-10-28"\nslug: live\ntags: []\n---\nLive body\nstudioDeleted: true';
  const deleted = '---\r\ntitle: "PRIVATE TITLE --- separator"\r\ndescription: PRIVATE DESCRIPTION\r\ndate: "2026-10-28"\r\nslug: removed\r\ntags: []\r\nstudioDeleted: true\r\n---\r\nPRIVATE BODY';
  await db.query("insert into public.studio_documents(collection, slug, document) values ('posts','live',$1),('posts','removed',$2)", [active, deleted]);
  await db.exec(await readFile(new URL("../supabase/migrations/0005_private_content_trash.sql", import.meta.url), "utf8"));
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    const { rows } = await db.query("select slug, document from public.public_studio_documents order by slug");
    assert.equal(rows.length, 2);
    assert.equal(rows[0].document, active);
    assert.match(rows[1].document, /studioDeleted: true/);
    assert.doesNotMatch(JSON.stringify(rows), /PRIVATE/);
    if (role === "anon") {
      await assert.rejects(db.query("select document from public.studio_documents"), /permission denied/);
    } else {
      assert.equal((await db.query("select document from public.studio_documents")).rows.length, 0);
    }
    await assert.rejects(db.query("insert into public.studio_documents(collection,slug,document) values ('posts','intrusion','secret')"));
    await db.exec("reset role");
  }
  await db.exec("set role authenticated; set test.owner = 'yes'");
  assert.equal((await db.query("select document from public.studio_documents where slug='removed'")).rows[0].document, deleted);
  const restored = deleted.replace("studioDeleted: true\r\n", "");
  await db.query("update public.studio_documents set is_deleted=false, document=$1 where slug='removed'", [restored]);
  assert.equal((await db.query("select document from public.public_studio_documents where slug='removed'")).rows[0].document, restored);
  console.log("PASS: PostgreSQL migration, tombstone backfill, anon/non-owner isolation, owner recovery and restored visibility.");
} finally {
  await db.close();
}
