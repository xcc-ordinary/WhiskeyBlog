import "server-only";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/supabase/auth";
import type { Database } from "@/lib/supabase/types";
import matter from "gray-matter";

export type ContentCollection = "posts" | "projects";
export function cloudContentEnabled() { return process.env.STUDIO_CONTENT_BACKEND === "supabase"; }

/** Anonymous, uncached reads: saved Studio documents are published immediately. */
export async function readCloudDocuments(collection: ContentCollection) {
  if (!cloudContentEnabled()) return [];
  // Online edits are request-time data, including when local MDX supplied the
  // build's known slugs. Never query Supabase while prerendering an article.
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("线上内容服务缺少 Supabase 公开配置。");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const { data, error } = await client.from("public_studio_documents").select("slug, document").eq("collection", collection).abortSignal(AbortSignal.timeout(8000));
  if (error) {
    const code = /^[a-z0-9]+$/i.test(error.code ?? "") ? error.code : "network";
    console.error("Public content read failed.", { code });
    throw new Error("内容暂时无法载入，请稍后重试。");
  }
  return data;
}

/** Full recycled documents must only be read with the authenticated owner's RLS. */
export async function readOwnerCloudDocuments(collection: ContentCollection) {
  if (!cloudContentEnabled()) return [];
  const client = await createSupabaseServerClient();
  await requireOwner(client);
  const { data, error } = await client.from("studio_documents").select("slug, document").eq("collection", collection);
  if (error) throw new Error("无法读取工作台内容，请稍后重试。");
  return data ?? [];
}

export async function saveCloudDocument(collection: ContentCollection, slug: string, document: string, existing: boolean) {
  const client = await createSupabaseServerClient();
  await requireOwner(client);
  const row = { collection, slug, document, is_deleted: matter(document).data.studioDeleted === true, updated_at: new Date().toISOString() };
  const { error } = existing
    ? await client.from("studio_documents").upsert(row, { onConflict: "collection,slug" })
    : await client.from("studio_documents").insert(row);
  if (error?.code === "23505") throw new Error("这个 slug 已经存在，请换一个名称。");
  if (error) throw new Error("保存失败，请确认已应用 Supabase 0004 迁移且账户有所有者权限。");
}

/** Public artwork only; private photographs keep using the separate private buckets. */
export async function uploadCloudContentImage(bytes: Buffer, extension: string) {
  const client = await createSupabaseServerClient();
  await requireOwner(client);
  const objectPath = `owner/${crypto.randomUUID()}.${extension}`;
  const types: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  const { error } = await client.storage.from("content-images").upload(objectPath, bytes, { contentType: types[extension], upsert: false, cacheControl: "31536000" });
  if (error) throw new Error("图片上传失败，请检查 content-images bucket 与所有者权限。");
  return client.storage.from("content-images").getPublicUrl(objectPath).data.publicUrl;
}
