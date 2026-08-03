import Link from "next/link";
import { EditorialButton } from "@/components/exhibition/editorial-button";
import { ExhibitionHero } from "@/components/exhibition/exhibition-hero";
import { LifeArchiveTeaser } from "@/components/exhibition/life-archive-teaser";
import { Reveal } from "@/components/exhibition/reveal";
import { SelectedWorks } from "@/components/exhibition/selected-works";
import { PostCard } from "@/components/post-card";
import { getPosts, getProjects } from "@/lib/content";
import { getPublicArchivePhotographs } from "@/lib/public-photographs";

export default async function Home() {
  const projects = getProjects();
  const posts = getPosts();
  const photographs = process.env.PLAYWRIGHT_ARCHIVE_FIXTURE === "1"
    ? await getPublicArchivePhotographs({ getPublished: async () => [], signDerivativeUrl: async () => null })
    : await getPublicArchivePhotographs();

  return <><ExhibitionHero /><SelectedWorks projects={projects} /><LifeArchiveTeaser photographs={photographs} /><Reveal className="home-about site-container"><p className="section-label">04 / ABOUT</p><h2>持续生长，保持具体。</h2><p>我通过真实项目学习设计、开发、测试与发布。</p><EditorialButton href="/about" variant="secondary">More about me</EditorialButton></Reveal><section className="latest-notes site-container" aria-label="Latest notes"><Reveal><p className="section-label">05 / LATEST NOTES</p><div className="latest-notes-heading"><h2>最近写下的事。</h2><Link href="/blog">All notes <span aria-hidden="true">↗</span></Link></div></Reveal><div className="notes-list">{posts.slice(0, 3).map((post) => <PostCard key={post.slug} post={post} />)}</div></section></>;
}
