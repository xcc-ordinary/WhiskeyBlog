import "server-only";
import { cache } from "react";
import matter from "gray-matter";
import { getPosts as localPosts, getProjects as localProjects, getPost as localPost, getProject as localProject, parseContentDocument, type PostDocument, type ProjectDocument, type PostSummary, type ProjectSummary } from "@/lib/content";
import { readCloudDocuments, type ContentCollection } from "@/lib/studio-content-store";

const documents = cache(async (collection: ContentCollection) => {
  const rows = await readCloudDocuments(collection);
  return rows.map(row => {
    const summary = parseContentDocument<PostSummary | ProjectSummary>(row.document, collection, collection === "posts" ? "post" : "project");
    if (summary.slug !== row.slug) throw new Error("线上内容 slug 与元数据不一致。");
    return { ...summary, source: matter(row.document).content };
  });
});

function merge<T extends PostSummary | ProjectSummary>(local: T[], cloud: T[]): T[] {
  return [...new Map([...local, ...cloud].map(item => [item.slug, item])).values()].sort((a, b) => b.date.localeCompare(a.date));
}
function summary<T extends PostDocument | ProjectDocument>(document: T): Omit<T, "source"> {
  const { source, ...meta } = document;
  void source;
  return meta;
}
export const getPosts = cache(async (): Promise<PostSummary[]> => merge(localPosts(), (await documents("posts") as PostDocument[]).map(summary)));
export const getProjects = cache(async (): Promise<ProjectSummary[]> => merge(localProjects(), (await documents("projects") as ProjectDocument[]).map(summary)));
export const getPost = cache(async (slug: string): Promise<PostDocument | null> => await documents("posts").then(rows => rows.find(row => row.slug === slug) as PostDocument | undefined) ?? localPost(slug));
export const getProject = cache(async (slug: string): Promise<ProjectDocument | null> => await documents("projects").then(rows => rows.find(row => row.slug === slug) as ProjectDocument | undefined) ?? localProject(slug));
