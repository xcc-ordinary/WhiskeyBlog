import { isSupportedDocumentCover } from "@/lib/project-images";

export type StudioDocumentFields = {
  title: string; description: string; author: string; slug: string; date: string; tags: string;
  coverImage: string; coverAlt: string; source: string; role: string; featured: string;
  homeOrder: string; titleEn: string; descriptionEn: string; homeLabel: string; coverFit: string; coverPosition: string;
};

export function documentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function documentMarkdown(fields: StudioDocumentFields, kind: "post" | "project") {
  const keys: (keyof StudioDocumentFields)[] = ["title", "description", "date", "slug", "coverImage", "coverAlt", ...(kind === "post" ? ["author"] as const : ["role", "coverFit", "coverPosition", "titleEn", "descriptionEn", "homeLabel"] as const)];
  const meta = keys.filter(key => fields[key]).map(key => `${key}: ${JSON.stringify(fields[key])}`);
  meta.push(`tags: ${JSON.stringify(fields.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))}`);
  if (kind === "project") meta.push(`featured: ${fields.featured === "true"}`, `homeOrder: ${Number(fields.homeOrder) || 0}`);
  return ["---", ...meta, "---", "", fields.source, ""].join("\n");
}

export function documentIssues(fields: StudioDocumentFields) {
  return [
    !fields.title.trim() && "填写标题",
    !fields.description.trim() && "填写摘要",
    !fields.source.trim() && "写一点正文",
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug) && "检查文章地址（小写英文、数字与连字符）",
    !/^\d{4}-\d{2}-\d{2}$/.test(fields.date) && "填写日期",
    !fields.tags.split(/[,，]/).some(tag => tag.trim()) && "添加至少一个标签",
    fields.source.length > 200_000 && "正文不超过 200,000 字符",
    Boolean(fields.coverImage) && !isSupportedDocumentCover(fields.coverImage) && "上传封面，或使用站内路径 / 公开 Supabase 图片地址",
  ].filter(Boolean) as string[];
}

export function insertMarkdown(source: string, start: number, end: number, before: string, after = "", placeholder = "文字") {
  const selected = source.slice(start, end) || placeholder;
  return { source: `${source.slice(0, start)}${before}${selected}${after}${source.slice(end)}`, start: start + before.length, end: start + before.length + selected.length };
}
