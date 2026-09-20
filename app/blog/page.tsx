import type { Metadata } from "next";

import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { NotesFilter } from "@/components/exhibition/notes-filter";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "博客",
  description: "关于设计、开发、项目过程与生活观察的 Notes。",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="blog-page">
      <ExplorerHero
        eyebrow="05 / FIELD NOTES"
        title="把过程，写成证据。"
        description="关于设计、开发、项目过程，以及那些不想被快速略过的生活观察。"
        image="/images/site-backgrounds/notes-open-water-v1.webp"
      />
      <div className="blog-directory painted-index-transition">
        <div className="blog-directory-canvas site-container">
          <div className="blog-directory-heading">
            <div>
              <p className="section-label">RECENT NOTES</p>
              <h2>文章与札记</h2>
            </div>
            <p>从实践出发，记录可复用的方法、工具与仍在形成中的想法。</p>
          </div>
          <NotesFilter posts={getPosts()} />
        </div>
      </div>
    </div>
  );
}
