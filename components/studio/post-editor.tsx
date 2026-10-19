"use client";
import { DocumentEditor } from "@/components/studio/document-editor";
import type { PostDocument, PostSummary } from "@/lib/content";
export function PostEditor({ post = null, posts = [], wikiLinks = {} }: { post?: PostDocument | null; posts?: PostSummary[]; wikiLinks?: Record<string, string> }) {
  return <DocumentEditor kind="post" document={post} documents={posts} wikiLinks={wikiLinks} />;
}
