import { unified } from "unified";
import remarkParse from "remark-parse";

export function normalizeTags(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(value => value.trim().replace(/^#+/, "")).filter(value => {
    if (!value || value.length > 80 || seen.has(value.toLocaleLowerCase())) return false;
    seen.add(value.toLocaleLowerCase()); return true;
  });
}
/** Only a dedicated trailing tag paragraph counts; prose, URLs and code are left alone. */
export function footerTags(source: string): string[] {
  const nodes = unified().use(remarkParse).parse(source).children;
  const tags: string[] = [];
  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index];
    if (node.type === "definition") continue;
    if (node.type !== "paragraph" || node.children.some(child => child.type !== "text")) break;
    const text = source.slice(node.position?.start.offset ?? 0, node.position?.end.offset ?? 0).trim();
    const matches = [...text.matchAll(/(?:^|[\s,，])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)(?=$|[\s,，])/gu)];
    const remainder = text.replace(/(?:^|[\s,，])#[\p{L}\p{N}_][\p{L}\p{N}_/-]*(?=$|[\s,，])/gu, "").replace(/[\s,，]/g, "");
    if (!matches.length || remainder) break;
    tags.unshift(...matches.map(match => match[1]));
  }
  return normalizeTags(tags);
}
export function documentTags(tags: string | string[], source: string) {
  return normalizeTags([...(Array.isArray(tags) ? tags : tags.split(/[,，]/)), ...footerTags(source)]);
}
export function matchesTagQuery(tags: string[], query: string) {
  const wanted = query.trim().replace(/^#/, "").toLocaleLowerCase();
  return tags.some(tag => tag.toLocaleLowerCase() === wanted || tag.toLocaleLowerCase().startsWith(`${wanted}/`));
}
