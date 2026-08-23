import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/mdx-content";
import { getPost, getPosts } from "@/lib/content";

// A newly saved slug must resolve immediately; static params only describe the
// build-time set and must not make the authoring workflow return a 404.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <div className="blog-article-page">
      <article className="blog-article site-container" aria-labelledby="article-title">
        <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
        <header>
          <p className="section-label">{post.tags[0] ?? "FIELD NOTE"} / {post.date}</p>
          <h1 id="article-title">{post.title}</h1>
          <p>{post.description}</p>
          {post.coverImage ? <figure className="blog-article-cover"><Image alt={post.coverAlt ?? post.title} fill priority sizes="(max-width: 760px) 100vw, 720px" src={post.coverImage} /></figure> : null}
        </header>
        <MdxContent source={post.source} />
      </article>
    </div>
  );
}
