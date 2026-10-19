import "server-only";
import matter from "gray-matter";

export function parseMarkdownUpload(text: string, filename: string) {
  text = text.replace(/^\uFEFF/, "");
  if (/^---[^\r\n]+(?:\r?\n|$)/.test(text)) throw new Error("仅支持 YAML 格式的文章信息，不执行 MDX 或 JavaScript。");
  const { data, content } = matter(text);
  if (content.length > 200_000) throw new Error("正文请控制在 200,000 字符以内。");
  const metadata: Record<string, string> = {};
  for (const key of ["title", "description", "author", "coverImage", "coverAlt", "role", "titleEn", "descriptionEn", "homeLabel", "coverFit", "coverPosition"]) {
    if (typeof data[key] === "string") metadata[key] = data[key].trim();
  }
  metadata.title ||= content.match(/^#\s+(.+)$/m)?.[1].trim() || filename.replace(/\.(?:md|markdown|mdx)$/i, "");
  metadata.description ||= content.replace(/^#{1,6}\s+[^\n]+/gm, "").split(/\n\s*\n/).map(line => line.trim()).find(line => line && !/^(?:[!>|`~]|---)/.test(line))?.replace(/[*_`\[\]]/g, "").slice(0, 140) || "";
  if (Array.isArray(data.tags) && data.tags.every((tag: unknown) => typeof tag === "string")) metadata.tags = data.tags.join(", ");
  else if (typeof data.tags === "string") metadata.tags = data.tags;
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) metadata.date = date;
  const slug = data.slug || filename.replace(/\.(?:md|markdown|mdx)$/i, "");
  if (typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) metadata.slug = slug;
  if (typeof data.featured === "boolean") metadata.featured = String(data.featured);
  if (Number.isSafeInteger(data.homeOrder) && data.homeOrder >= 0) metadata.homeOrder = String(data.homeOrder);
  return { metadata, source: content.trim() };
}
