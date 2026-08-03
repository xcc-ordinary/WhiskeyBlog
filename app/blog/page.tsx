import { NotesFilter } from "@/components/exhibition/notes-filter";
import { XiaohongshuHandoff } from "@/components/exhibition/xiaohongshu-handoff";
import { getPosts } from "@/lib/content";
import { Reveal } from "@/components/exhibition/reveal";

export default function BlogPage() {
  return (
    <section className="blog-directory site-container" aria-labelledby="blog-title">
      <Reveal>
        <p className="section-label">05 / FIELD NOTES</p>
        <h1 id="blog-title">把过程，<br />写成证据。</h1>
        <p>关于设计、开发、项目过程，以及那些不想被快速略过的生活观察。</p>
      </Reveal>
      <Reveal delay={0.08}><NotesFilter posts={getPosts()} /></Reveal>
      <XiaohongshuHandoff />
    </section>
  );
}
