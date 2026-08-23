import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { NotesFilter } from "@/components/exhibition/notes-filter";
import { getPosts } from "@/lib/content";
import { Reveal } from "@/components/exhibition/reveal";

// Posts can be authored from the protected Studio while the server is running.
// Do not freeze the directory to the content files that existed at build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function BlogPage() {
  return (
    <div className="blog-page">
      <ExplorerHero
        eyebrow="05 / FIELD NOTES"
        title="把过程，写成证据。"
        description="关于设计、开发、项目过程，以及那些不想被快速略过的生活观察。"
        image="/images/site-backgrounds/notes-open-water-v1.png"
      />
      <div className="blog-directory painted-index-transition">
        <div className="blog-directory-canvas site-container">
          <Reveal delay={0.08}><NotesFilter posts={getPosts()} /></Reveal>
        </div>
      </div>
    </div>
  );
}
