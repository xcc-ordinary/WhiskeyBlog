import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/mdx-content";
import { ArticleReadingTools, ArticleShareButton } from "@/components/article-reading-tools";
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
  const headings = extractArticleHeadings(post.source).filter((heading) => heading.text !== "目录");
  const posts = getPosts();
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const nextPost = posts[(currentIndex + 1) % posts.length];
  const titleParts = post.title.match(/^([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*)*)\s+(.+)$/u);

  return (
    <div className="blog-article-page">
      <article className="blog-article site-container" aria-labelledby="article-title">
        <div className="blog-article-topline">
          <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
        </div>
        <header className="blog-article-header">
          <p className="section-label">{titleParts?.[1] ?? "Whiskey 手记"} · 安装手册 · {post.date.slice(0, 7).replace("-", ".")}</p>
          <h1 aria-label={post.title} id="article-title">{titleParts?.[2] === "最新版安装教程" ? <><span>最新版</span><span>安装教程</span></> : (titleParts?.[2] ?? post.title)}</h1>
          <p className="blog-article-deck">{post.description}</p>
          <div className="blog-article-meta">
            <p><strong>{post.author ?? "Whiskey"}</strong><span>{post.date.replaceAll("-", ".")} · {post.readingMinutes ?? 1} 分钟阅读</span></p>
            <ArticleShareButton title={post.title} />
          </div>
          {post.coverImage ? <figure className="blog-article-cover"><Image alt={post.coverAlt ?? post.title} fill priority sizes="(max-width: 760px) 100vw, 720px" src={post.coverImage} /></figure> : null}
        </header>
        <ArticleReadingTools headings={headings} />
        <div className="blog-article-reading-layout"><MdxContent source={post.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "")} /></div>
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
