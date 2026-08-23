"use server";

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { requireRepositoryContentWrites } from "@/lib/content-writes";
import { requireOwner } from "@/lib/supabase/auth";

type Result = { ok: true; message: string } | { ok: false; message: string };
const root = process.cwd();
const postDirectory = path.join(root, "content", "posts");
const coverDirectory = path.join(root, "public", "images", "blog-covers");
const maxCoverBytes = 3.75 * 1024 * 1024;
const clean = (value: FormDataEntryValue | null) => typeof value === "string" ? value.trim() : "";
const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

function yaml(value: string) { return JSON.stringify(value); }

export async function saveStudioPost(form: FormData): Promise<Result> {
  try {
    await requireOwner();
    requireRepositoryContentWrites();
    const title = clean(form.get("title"));
    const description = clean(form.get("description"));
    const slug = clean(form.get("slug"));
    const originalSlug = clean(form.get("originalSlug"));
    const date = clean(form.get("date"));
    const tags = clean(form.get("tags")).split(",").map((tag) => tag.trim()).filter(Boolean);
    const coverImage = clean(form.get("coverImage"));
    const coverAlt = clean(form.get("coverAlt"));
    const source = clean(form.get("source"));
    if (!title || !description || !source || !validSlug(slug) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !tags.length) return { ok: false, message: "请填写标题、摘要、日期、至少一个标签、正文，并使用小写英文 slug。" };
    if (originalSlug && originalSlug !== slug) return { ok: false, message: "已有 Notes 的 slug 不能直接修改，请新建一篇 Notes。" };
    const targetPath = path.join(postDirectory, `${slug}.mdx`);
    if (!originalSlug) {
      try { await access(targetPath); return { ok: false, message: "这个 slug 已经存在，请换一个名称。" }; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    const frontmatter = ["---", `title: ${yaml(title)}`, `description: ${yaml(description)}`, `date: ${yaml(date)}`, `tags: [${tags.map(yaml).join(", ")}]`, `slug: ${yaml(slug)}`, coverImage ? `coverImage: ${yaml(coverImage)}` : "", coverAlt ? `coverAlt: ${yaml(coverAlt)}` : "", "---", "", source, ""].filter(Boolean).join("\n");
    await mkdir(postDirectory, { recursive: true });
    await writeFile(targetPath, frontmatter, "utf8");
    revalidatePath("/blog", "page"); revalidatePath(`/blog/${slug}`, "page");
    return { ok: true, message: "文章已保存并刷新公开页面。" };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "保存失败。" }; }
}

export async function uploadStudioPostCover(form: FormData): Promise<{ ok: boolean; message?: string; path?: string }> {
  try {
    await requireOwner();
    requireRepositoryContentWrites();
    const file = form.get("cover");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "请选择封面图片。" };
    if (!file.type.startsWith("image/") || file.size > maxCoverBytes) return { ok: false, message: "封面须为 3.75MB 以内的图片。" };
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    await mkdir(coverDirectory, { recursive: true });
    await writeFile(path.join(coverDirectory, fileName), Buffer.from(await file.arrayBuffer()));
    return { ok: true, path: `/images/blog-covers/${fileName}` };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "上传失败。" }; }
}
