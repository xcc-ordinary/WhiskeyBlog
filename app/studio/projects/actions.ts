"use server";

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { requireRepositoryContentWrites } from "@/lib/content-writes";
import { requireOwner } from "@/lib/supabase/auth";

const projectDirectory = path.join(process.cwd(), "content", "projects");
const clean = (value: FormDataEntryValue | null) => typeof value === "string" ? value.trim() : "";
const yaml = (value: string) => JSON.stringify(value);
const validSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export async function saveStudioProjectNotes(form: FormData): Promise<{ ok: boolean; message: string }> {
  try {
    await requireOwner();
    requireRepositoryContentWrites();
    const slug = clean(form.get("slug"));
    const originalSlug = clean(form.get("originalSlug"));
    const title = clean(form.get("title"));
    const description = clean(form.get("description"));
    const date = clean(form.get("date"));
    const role = clean(form.get("role"));
    const coverImage = clean(form.get("coverImage"));
    const coverAlt = clean(form.get("coverAlt"));
    const source = clean(form.get("source"));
    const tags = clean(form.get("tags")).split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!validSlug(slug) || !title || !description || !source || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !tags.length) return { ok: false, message: "请填写项目名称、简介、日期、至少一个标签、笔记正文和有效 slug。" };
    if (originalSlug && originalSlug !== slug) return { ok: false, message: "已有项目的 slug 不能直接修改，请新建一个项目。" };

    await mkdir(projectDirectory, { recursive: true });
    const targetPath = path.join(projectDirectory, `${slug}.mdx`);
    if (!originalSlug) {
      try { await access(targetPath); return { ok: false, message: "这个项目 slug 已经存在，请换一个名称。" }; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }

    const document = [
      "---",
      `title: ${yaml(title)}`,
      `description: ${yaml(description)}`,
      `date: ${yaml(date)}`,
      `tags: [${tags.map(yaml).join(", ")}]`,
      `slug: ${yaml(slug)}`,
      coverImage ? `coverImage: ${yaml(coverImage)}` : "",
      coverAlt ? `coverAlt: ${yaml(coverAlt)}` : "",
      role ? `role: ${yaml(role)}` : "",
      "---",
      "",
      source,
      "",
    ].filter(Boolean).join("\n");
    await writeFile(targetPath, document, "utf8");
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${slug}`);
    return { ok: true, message: "项目已保存并刷新公开页面。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "保存失败。" };
  }
}
