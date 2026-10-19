import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { estimateReadingMinutes } from "@/lib/article";
import { firstProjectBodyImage, validProjectCoverPosition, type ProjectCoverFit } from "@/lib/project-images";
export type ContentMeta = { title: string; description: string; date: string; tags: string[]; slug: string; author?: string; coverImage?: string; coverAlt?: string; readingMinutes?: number };
export type PostSummary = ContentMeta & { kind: "post"; href: string };
export type ProjectSummary = ContentMeta & { kind: "project"; href: string; coverImage?: string; coverAlt?: string; coverFit?: ProjectCoverFit; coverPosition?: string; role?: string; featured?: boolean; homeOrder?: number; titleEn?: string; descriptionEn?: string; homeLabel?: string };
export type PostDocument = PostSummary & { source: string };
export type ProjectDocument = ProjectSummary & { source: string };
const contentRoot = path.join(process.cwd(), "content");
function readCollection<T extends PostSummary | ProjectSummary>(collection: "posts" | "projects", kind: T["kind"]): T[] {
  const directory = path.join(contentRoot, collection);
  return readdirSync(directory).filter((file) => file.endsWith(".mdx")).map((file) => {
    return parseContentDocument<T>(readFileSync(path.join(directory, file), "utf8"), collection, kind, file);
  }).sort((a, b) => b.date.localeCompare(a.date));
}
export function parseContentDocument<T extends PostSummary | ProjectSummary>(document: string, collection: "posts" | "projects", kind: T["kind"], file = "Studio"): T {
  const parsed = matter(document);
  const data = parsed.data as Partial<ContentMeta>;
  if (!data.title || !data.description || !data.slug || !/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? "") || !Array.isArray(data.tags) || !data.tags.every((tag) => typeof tag === "string")) throw new Error("无效内容元数据：" + file);
  const optionalProjectData = parsed.data as Record<string, unknown>;
  const optionalProjectKeys = ["author", "coverImage", "coverAlt", "role", "titleEn", "descriptionEn", "homeLabel"] as const;
  if (optionalProjectKeys.some((key) => key in optionalProjectData && typeof optionalProjectData[key] !== "string")) throw new Error("无效内容元数据");
  if (collection === "projects" && (("featured" in optionalProjectData && typeof optionalProjectData.featured !== "boolean") || ("homeOrder" in optionalProjectData && (!Number.isSafeInteger(optionalProjectData.homeOrder) || Number(optionalProjectData.homeOrder) < 0)))) throw new Error("无效内容元数据");
  if (collection === "projects" && (("coverFit" in optionalProjectData && !["cover", "contain"].includes(String(optionalProjectData.coverFit))) || ("coverPosition" in optionalProjectData && (typeof optionalProjectData.coverPosition !== "string" || !validProjectCoverPosition(optionalProjectData.coverPosition))))) throw new Error("无效内容元数据");
  const bodyCover = collection === "projects" && !(typeof optionalProjectData.coverImage === "string" && optionalProjectData.coverImage.trim()) ? firstProjectBodyImage(parsed.content) : undefined;
  return {
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags,
    slug: data.slug,
    kind,
    href: (collection === "posts" ? "/blog/" : "/projects/") + data.slug,
    readingMinutes: estimateReadingMinutes(parsed.content),
    ...(typeof optionalProjectData.author === "string" ? { author: optionalProjectData.author } : {}),
    ...(typeof optionalProjectData.coverImage === "string" && optionalProjectData.coverImage.trim() ? { coverImage: optionalProjectData.coverImage.trim() } : {}),
    ...(typeof optionalProjectData.coverAlt === "string" ? { coverAlt: optionalProjectData.coverAlt } : {}),
    ...(bodyCover ? { coverImage: bodyCover.src, coverAlt: typeof optionalProjectData.coverAlt === "string" && optionalProjectData.coverAlt ? optionalProjectData.coverAlt : bodyCover.alt || `${data.title} 项目封面` } : {}),
    ...(collection === "projects" && typeof optionalProjectData.role === "string" ? { role: optionalProjectData.role } : {}),
    ...(collection === "projects" ? Object.fromEntries(["featured", "homeOrder", "titleEn", "descriptionEn", "homeLabel"].filter(key => key in optionalProjectData).map(key => [key, optionalProjectData[key]])) : {}),
    ...(collection === "projects" ? { coverFit: optionalProjectData.coverFit ?? "cover", coverPosition: optionalProjectData.coverPosition ?? "center" } : {}),
  } as T;
}
export const getPosts = cache((): PostSummary[] => readCollection<PostSummary>("posts", "post"));
export const getProjects = cache((): ProjectSummary[] => readCollection<ProjectSummary>("projects", "project"));
export const getPost = cache((slug: string): PostDocument | null => { const post = getPosts().find((item) => item.slug === slug); if (!post) return null; return { ...post, source: matter(readFileSync(path.join(contentRoot, "posts", slug + ".mdx"), "utf8")).content }; });
export const getProject = cache((slug: string): ProjectDocument | null => { const project = getProjects().find((item) => item.slug === slug); if (!project) return null; return { ...project, source: matter(readFileSync(path.join(contentRoot, "projects", slug + ".mdx"), "utf8")).content }; });
