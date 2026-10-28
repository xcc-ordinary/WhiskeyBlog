"use server";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/supabase/auth";
import { cloudContentEnabled, readOwnerCloudDocuments, saveCloudDocument, type ContentCollection } from "@/lib/studio-content-store";
import { requireRepositoryContentWrites } from "@/lib/content-writes";
import { parseContentDocument, type PostSummary, type ProjectSummary } from "@/lib/content";

function valid(collection: string, slug: string): asserts collection is ContentCollection {
  if (typeof collection !== "string" || typeof slug !== "string" || !["posts", "projects"].includes(collection) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("内容地址无效。");
}
async function localDocument(collection: ContentCollection, slug: string) {
  try { return await readFile(path.join(process.cwd(), "content", collection, `${slug}.mdx`), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
/** Recoverable removal: retain the complete document and never delete artwork. */
export async function changeStudioContentState(collection: string, slug: string, deleted: boolean) {
  try {
    await requireOwner(); valid(collection, slug);
    if (typeof deleted !== "boolean") throw new Error("操作无效。");
    if (!cloudContentEnabled()) requireRepositoryContentWrites();
    const rows = cloudContentEnabled() ? await readOwnerCloudDocuments(collection) : [];
    const document = rows.find(row => row.slug === slug)?.document ?? await localDocument(collection, slug);
    if (!document) throw new Error("未找到这篇内容。");
    const parsed = matter(document);
    if (parsed.data.slug !== slug) throw new Error("内容地址与元数据不一致。");
    if (deleted) parsed.data.studioDeleted = true;
    else delete parsed.data.studioDeleted;
    const updated = matter.stringify(parsed.content, parsed.data);
    if (cloudContentEnabled()) await saveCloudDocument(collection, slug, updated, true);
    else await writeFile(path.join(process.cwd(), "content", collection, `${slug}.mdx`), updated, "utf8");
    for (const route of ["/", "/blog", "/projects", `/blog/${slug}`, `/projects/${slug}`, "/studio", "/studio/writing", "/studio/projects", "/sitemap.xml"]) revalidatePath(route);
    return { ok: true, message: deleted ? "已移至回收站，可随时恢复。" : "内容已恢复到网站。" };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "操作失败，请重试。" }; }
}
export async function getStudioTrash(): Promise<(PostSummary | ProjectSummary)[]> {
  await requireOwner();
  const archived: (PostSummary | ProjectSummary)[] = [];
  for (const collection of ["posts", "projects"] as const) {
    const cloud = cloudContentEnabled() ? await readOwnerCloudDocuments(collection) : [];
    const overridden = new Set(cloud.map(row => row.slug));
    const folder = path.join(process.cwd(), "content", collection);
    const local = await Promise.all((await readdir(folder)).filter(file => file.endsWith(".mdx") && !overridden.has(file.slice(0, -4))).map(async file => ({ document: await readFile(path.join(folder, file), "utf8") })));
    for (const row of [...cloud, ...local]) {
      if (matter(row.document).data.studioDeleted !== true) continue;
      archived.push(parseContentDocument(row.document, collection, collection === "posts" ? "post" : "project"));
    }
  }
  return archived.sort((a, b) => b.date.localeCompare(a.date));
}
