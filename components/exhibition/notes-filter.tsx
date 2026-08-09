"use client";

import { useMemo, useState } from "react";

import { NotesDirectory } from "@/components/exhibition/notes-directory";
import type { PostSummary } from "@/lib/content";

export function NotesFilter({ posts }: { posts: PostSummary[] }) {
  const categories = useMemo(() => ["全部", ...Array.from(new Set(posts.flatMap((post) => post.tags)))], [posts]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const visiblePosts = activeCategory === "全部" ? posts : posts.filter((post) => post.tags.includes(activeCategory));

  return (
    <section aria-label="文章分类">
      <div className="notes-filter" role="toolbar" aria-label="按分类筛选文章">
        {categories.map((category) => (
          <button aria-pressed={activeCategory === category} key={category} onClick={() => setActiveCategory(category)} type="button">
            {category}
          </button>
        ))}
      </div>
      <NotesDirectory posts={visiblePosts} />
    </section>
  );
}
