import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/mdx-content";
import { ArticleReadingTools } from "@/components/article-reading-tools";
import { extractArticleHeadings } from "@/lib/article";
import { getPost, getPosts } from "@/lib/content";

export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.title,
    description: post.description,
    ...(post.author ? { authors: [{ name: post.author }] } : {}),
    alternates: { canonical: post.href },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      tags: post.tags,
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.coverAlt ?? post.title }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const headings = extractArticleHeadings(post.source);
  const posts = getPosts();
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const nextPost = posts[(currentIndex + 1) % posts.length];

  return (
    <div className="blog-article-page">
      <article className="blog-article site-container" aria-labelledby="article-title">
        <div className="blog-article-topline">
          <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
          <span>{post.readingMinutes ?? 1} 分钟阅读</span>
        </div>
        <header className="blog-article-header">
          <p className="section-label">{post.tags[0] ?? "FIELD NOTE"}</p>
          <h1 id="article-title">{post.title}</h1>
          <p className="blog-article-deck">{post.description}</p>
          <div className="blog-article-meta">
            <span aria-hidden="true" className="blog-author-mark">W</span>
            <p><strong>{post.author ?? "Whiskey"}</strong><span>{post.date} · {post.readingMinutes ?? 1} 分钟阅读</span></p>
          </div>
          {post.coverImage ? <figure className="blog-article-cover"><Image alt={post.coverAlt ?? post.title} fill priority sizes="(max-width: 760px) 100vw, 720px" src={post.coverImage} /></figure> : null}
        </header>
        <div className="blog-article-reading-layout">
          <ArticleReadingTools headings={headings} title={post.title} />
          <MdxContent source={post.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "")} />
        </div>
        {nextPost && nextPost.slug !== post.slug ? (
          <footer className="blog-article-next">
            <p className="section-label">NEXT NOTE</p>
            <Link href={nextPost.href}><span>继续阅读</span><strong>{nextPost.title}</strong><span aria-hidden="true">↗</span></Link>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
