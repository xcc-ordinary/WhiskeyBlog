import type { Metadata } from "next";

import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { NotesFilter } from "@/components/exhibition/notes-filter";
import { getPosts } from "@/lib/content";
import { Reveal } from "@/components/exhibition/reveal";

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
          <Reveal delay={0.08}><NotesFilter posts={getPosts()} /></Reveal>
        </div>
      </div>
    </div>
  );
}
