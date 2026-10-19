import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { markdownText, remarkObsidian } from "@/lib/markdown";
import type { Root, RootContent } from "mdast";

export type ArticleHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export { headingId } from "@/lib/heading-id";

export function extractArticleHeadings(source: string): ArticleHeading[] {
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkObsidian);
  const tree = parser.runSync(parser.parse(source)) as Root;
  const headings: ArticleHeading[] = [];
  function visit(node: Root | RootContent) {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const text = markdownText(node).trim();
      const id = String(node.data?.hProperties?.id ?? "");
      if (id && text) headings.push({ text, id, level: node.depth });
    }
    if ("children" in node) node.children.forEach((child) => visit(child as RootContent));
  }
  visit(tree);
  return headings;
}

export function estimateReadingMinutes(source: string): number {
  const readable = source
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`\[\]()!-]/g, " ");
  const hanCount = readable.match(/[\p{Script=Han}]/gu)?.length ?? 0;
  const latinWordCount = readable.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return Math.max(1, Math.ceil(hanCount / 400 + latinWordCount / 220));
}
