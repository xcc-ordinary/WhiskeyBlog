"use server";

import { MdxContent } from "@/components/mdx-content";
import { requireOwner } from "@/lib/supabase/auth";
import { parseMarkdownUpload } from "@/lib/markdown-import";

export async function importStudioMarkdown(form: FormData) {
  await requireOwner();
  const file = form.get("document");
  if (!(file instanceof File) || !/\.(md|markdown|mdx)$/i.test(file.name)) throw new Error("请选择 .md、.markdown 或 .mdx 文件。");
  if (!file.size || file.size > 800_000) throw new Error("文件为空或超过 800KB，请选择较小的 Markdown 文件。");
  return parseMarkdownUpload(await file.text(), file.name);
}

/** Preview uses exactly the same MDX components as the published document. */
export async function renderStudioMarkdown(source: string) {
  await requireOwner();
  if (typeof source !== "string" || source.length > 200_000) {
    throw new Error("正文过长，请缩短到 200,000 字符以内。");
  }
  return MdxContent({ source: source.replace(/^\s*#\s+[^\n]+\r?\n+/, "") });
}
