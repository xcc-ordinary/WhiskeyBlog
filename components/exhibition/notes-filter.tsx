"use client";

import { useMemo, useState } from "react";

import { matchesTagQuery } from "@/lib/content-tags";
import { NotesDirectory } from "@/components/exhibition/notes-directory";
import type { PostSummary } from "@/lib/content";

export function NotesFilter({ posts }: { posts: PostSummary[] }) {
  const categories = useMemo(() => ["全部", ...Array.from(new Set(posts.flatMap((post) => post.tags)))], [posts]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const visiblePosts = posts.filter(post => (activeCategory === "全部" || matchesTagQuery(post.tags, activeCategory)) && (query.startsWith("#") ? matchesTagQuery(post.tags, query) : `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <section aria-label="文章分类">
      <div className="journal-notes-tools"><input type="search" aria-label="搜索文章" placeholder="搜索文章或 #标签…" value={query} onChange={event => setQuery(event.target.value)} /><div className="notes-filter" role="toolbar" aria-label="按分类筛选文章">
        {categories.map((category) => (
          <button aria-pressed={activeCategory === category} key={category} onClick={() => setActiveCategory(category)} type="button">
            {category === "全部" ? category : `#${category}`}
          </button>
        ))}
      </div>
      </div><p className="journal-notes-count">{visiblePosts.length} 篇文章 <span>观察 · 实践 · 记录</span></p><NotesDirectory posts={visiblePosts} />{!visiblePosts.length && <p className="journal-notes-empty">没有找到相关记录，试试其他关键词。</p>}
    </section>
  );
}
