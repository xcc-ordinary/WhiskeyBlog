export type ArticleHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export function headingId(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function plainHeading(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

export function extractArticleHeadings(source: string): ArticleHeading[] {
  return Array.from(source.matchAll(/^(##|###)\s+(.+)$/gm), (match) => {
    const text = plainHeading(match[2]);
    return { id: headingId(text), level: match[1].length as 2 | 3, text };
  }).filter((heading) => heading.id && heading.text);
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
