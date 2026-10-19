"use server";

import { MdxContent } from "@/components/mdx-content";
import { requireOwner } from "@/lib/supabase/auth";

/** Preview uses exactly the same MDX components as the published document. */
export async function renderStudioMarkdown(source: string) {
  await requireOwner();
  if (typeof source !== "string" || source.length > 200_000) {
    throw new Error("正文过长，请缩短到 200,000 字符以内。");
  }
  return MdxContent({ source: source.replace(/^\s*#\s+[^\n]+\r?\n+/, "") });
}
