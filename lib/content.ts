import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
export type ContentMeta = { title: string; description: string; date: string; tags: string[]; slug: string; coverImage?: string; coverAlt?: string };
export type PostSummary = ContentMeta & { kind: "post"; href: string };
export type ProjectSummary = ContentMeta & { kind: "project"; href: string; coverImage?: string; coverAlt?: string; role?: string };
export type PostDocument = PostSummary & { source: string };
export type ProjectDocument = ProjectSummary & { source: string };
const contentRoot = path.join(process.cwd(), "content");
function readCollection<T extends PostSummary | ProjectSummary>(collection: "posts" | "projects", kind: T["kind"]): T[] {
  const directory = path.join(contentRoot, collection);
  return readdirSync(directory).filter((file) => file.endsWith(".mdx")).map((file) => {
    const parsed = matter(readFileSync(path.join(directory, file), "utf8"));
    const data = parsed.data as Partial<ContentMeta>;
    if (!data.title || !data.description || !data.slug || !/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? "") || !Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === "string")) throw new Error("无效内容元数据：" + file);
    const optionalProjectData = parsed.data as Record<string, unknown>;
    const optionalProjectKeys = ["coverImage", "coverAlt", "role"] as const;
    if (optionalProjectKeys.some((key) => key in optionalProjectData && typeof optionalProjectData[key] !== "string")) throw new Error("无效内容元数据");
    return {
      title: data.title,
      description: data.description,
      date: data.date,
      tags: data.tags,
      slug: data.slug,
      kind,
      href: (collection === "posts" ? "/blog/" : "/projects/") + data.slug,
      ...(typeof optionalProjectData.coverImage === "string" ? { coverImage: optionalProjectData.coverImage } : {}),
      ...(typeof optionalProjectData.coverAlt === "string" ? { coverAlt: optionalProjectData.coverAlt } : {}),
      ...(collection === "projects" && typeof optionalProjectData.role === "string" ? { role: optionalProjectData.role } : {}),
    } as T;
  }).sort((a, b) => b.date.localeCompare(a.date));
}
export const getPosts = cache((): PostSummary[] => readCollection<PostSummary>("posts", "post"));
export const getProjects = cache((): ProjectSummary[] => readCollection<ProjectSummary>("projects", "project"));
export const getPost = cache((slug: string): PostDocument | null => { const post = getPosts().find((item) => item.slug === slug); if (!post) return null; return { ...post, source: matter(readFileSync(path.join(contentRoot, "posts", slug + ".mdx"), "utf8")).content }; });
export const getProject = cache((slug: string): ProjectDocument | null => { const project = getProjects().find((item) => item.slug === slug); if (!project) return null; return { ...project, source: matter(readFileSync(path.join(contentRoot, "projects", slug + ".mdx"), "utf8")).content }; });
