"use server";

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { documentTags } from "@/lib/content-tags";
import { revalidatePath } from "next/cache";

import { requireRepositoryContentWrites } from "@/lib/content-writes";
import { cloudContentEnabled, saveCloudDocument, uploadCloudContentImage } from "@/lib/studio-content-store";
import { requireOwner } from "@/lib/supabase/auth";
import { maxProjectImageBytes, projectImageExtension, validProjectCoverPosition } from "@/lib/project-images";

const projectDirectory = path.join(process.cwd(), "content", "projects");
const clean = (value: FormDataEntryValue | null) => typeof value === "string" ? value.trim() : "";
const yaml = (value: string) => JSON.stringify(value);
const validSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export async function saveStudioProjectNotes(form: FormData): Promise<{ ok: boolean; message: string }> {
  try {
    await requireOwner();
    if (!cloudContentEnabled()) requireRepositoryContentWrites();
    const slug = clean(form.get("slug"));
    const originalSlug = clean(form.get("originalSlug"));
    const title = clean(form.get("title"));
    const description = clean(form.get("description"));
    const date = clean(form.get("date"));
    const role = clean(form.get("role"));
    const coverImage = clean(form.get("coverImage"));
    const coverAlt = clean(form.get("coverAlt"));
    const coverFit = clean(form.get("coverFit")) || "cover";
    const coverPosition = clean(form.get("coverPosition")) || "center";
    const source = clean(form.get("source"));
    const featured = form.get("featured") !== "false";
    const homeOrder = Number(clean(form.get("homeOrder")) || "0");
    const titleEn = clean(form.get("titleEn"));
    const descriptionEn = clean(form.get("descriptionEn"));
    const homeLabel = clean(form.get("homeLabel"));
    const tags = documentTags(clean(form.get("tags")), clean(form.get("source")));
    if (!validSlug(slug) || !title || !description || !source || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !tags.length) return { ok: false, message: "请填写项目名称、简介、日期、至少一个标签、笔记正文和有效 slug。" };
    if (source.length > 200_000) return { ok: false, message: "正文请缩短到 200,000 字符以内。" };
    if (originalSlug && originalSlug !== slug) return { ok: false, message: "已有项目的 slug 不能直接修改，请新建一个项目。" };
    if (!Number.isSafeInteger(homeOrder) || homeOrder < 0) return { ok: false, message: "首页排序请填写大于或等于 0 的整数。" };
    if (!["cover", "contain"].includes(coverFit) || !validProjectCoverPosition(coverPosition)) return { ok: false, message: "请选择铺满或完整显示封面；焦点使用 center 或 0% 0% 至 100% 100% 的坐标。" };

    if (!cloudContentEnabled()) await mkdir(projectDirectory, { recursive: true });
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
      `coverFit: ${yaml(coverFit)}`,
      `coverPosition: ${yaml(coverPosition)}`,
      role ? `role: ${yaml(role)}` : "",
      `featured: ${featured}`,
      `homeOrder: ${homeOrder}`,
      titleEn ? `titleEn: ${yaml(titleEn)}` : "",
      descriptionEn ? `descriptionEn: ${yaml(descriptionEn)}` : "",
      homeLabel ? `homeLabel: ${yaml(homeLabel)}` : "",
      "---",
      "",
      source,
      "",
    ].filter(Boolean).join("\n");
    if (cloudContentEnabled()) await saveCloudDocument("projects", slug, document, Boolean(originalSlug));
    else await writeFile(targetPath, document, "utf8");
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/studio/projects");
    revalidatePath("/studio");
    revalidatePath("/sitemap.xml");
    return { ok: true, message: "项目已保存并刷新公开页面。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "保存失败。" };
  }
}

export async function uploadStudioProjectImage(form: FormData): Promise<{ ok: boolean; message?: string; path?: string }> {
  try {
    await requireOwner();
    if (!cloudContentEnabled()) requireRepositoryContentWrites();
    const file = form.get("image");
    if (!(file instanceof File) || !file.size || file.size > maxProjectImageBytes) return { ok: false, message: "请选择 3.75MB 以内的 JPG、PNG、WebP 或 GIF 图片。" };
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = projectImageExtension(bytes);
    if (!extension) return { ok: false, message: "图片格式无法识别，请使用 JPG、PNG、WebP 或 GIF。" };
    if (cloudContentEnabled()) return { ok: true, path: await uploadCloudContentImage(bytes, extension) };
    const directory = path.join(process.cwd(), "public", "images", "projects", "uploads");
    const filename = `${crypto.randomUUID()}.${extension}`;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
    return { ok: true, path: `/project-media/${filename}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "图片上传失败，请稍后重试。" };
  }
}
