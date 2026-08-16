import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { NotesFilter } from "@/components/exhibition/notes-filter";
import { XiaohongshuHandoff } from "@/components/exhibition/xiaohongshu-handoff";
import { getPosts } from "@/lib/content";
import { Reveal } from "@/components/exhibition/reveal";

export default function BlogPage() {
  return (
    <>
      <ExplorerHero
        eyebrow="05 / FIELD NOTES"
        title="把过程，写成证据。"
        description="关于设计、开发、项目过程，以及那些不想被快速略过的生活观察。"
        image="/images/site-backgrounds/notes-open-water-v1.png"
      />
      <section className="blog-directory site-container" aria-label="Notes directory">
        <Reveal delay={0.08}><NotesFilter posts={getPosts()} /></Reveal>
        <XiaohongshuHandoff />
      </section>
    </>
  );
}
