"use client";
import { MarkdownDocument } from "@/components/markdown-document";
/** Local preview: authoring text never needs a server request to render. */
export function MarkdownPreview({ source, wikiLinks = {} }: { source: string; wikiLinks?: Record<string, string> }) {
  return <div className="blog-article-reading-layout studio-markdown-preview"><MarkdownDocument source={source.replace(/^\s*#\s+[^\n]+\r?\n+/, "")} wikiLinks={wikiLinks} /></div>;
}
