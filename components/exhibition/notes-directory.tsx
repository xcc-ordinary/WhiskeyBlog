import Link from "next/link";
import type { JSX } from "react";

import type { PostSummary } from "@/lib/content";

export function NotesDirectory({ posts }: { posts: PostSummary[] }): JSX.Element {
  return (
    <ol className="notes-directory">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Link href={post.href} aria-label={`阅读文章：${post.title}`}>
            <span className="notes-ordinal" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className="notes-title"><strong>{post.title}</strong><span>{post.description}</span></span>
            <small>{post.tags[0] ?? "未分类"} · {post.date}</small>
            <span className="notes-arrow" aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
