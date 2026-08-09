import Link from "next/link";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/mdx-content";
import { getPost, getPosts } from "@/lib/content";

export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <article className="blog-article site-container" aria-labelledby="article-title">
      <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
      <header>
        <p className="section-label">{post.tags[0] ?? "FIELD NOTE"} / {post.date}</p>
        <h1 id="article-title">{post.title}</h1>
        <p>{post.description}</p>
      </header>
      <MdxContent source={post.source} />
    </article>
  );
}
