import Link from "next/link";
import Image from "next/image";
import type { JSX } from "react";

import type { PostSummary } from "@/lib/content";

export function NotesDirectory({ posts }: { posts: PostSummary[] }): JSX.Element {
  return (
    <ol className="notes-directory">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Link href={post.href} aria-label={`阅读文章：${post.title}`}>
            <span className="notes-cover">{post.coverImage ? <Image alt={post.coverAlt ?? post.title} fill sizes="(max-width: 700px) 100vw, 320px" src={post.coverImage} /> : <span aria-hidden="true" className="notes-cover-placeholder">{String(index + 1).padStart(2, "0")}</span>}</span>
            <span className="notes-title"><strong>{post.title}</strong><span>{post.description}</span></span>
            <small><b>{post.tags[0] ?? "未分类"}</b><span>{post.date} · {post.readingMinutes ?? 1} 分钟阅读</span></small>
            <span className="notes-arrow" aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
