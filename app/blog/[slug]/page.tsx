import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/mdx-content";
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

  return (
    <div className="blog-article-page">
      <article className="blog-article site-container" aria-labelledby="article-title">
        <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
        <header>
          <p className="section-label">{post.tags[0] ?? "FIELD NOTE"} / {post.date}</p>
          <h1 id="article-title">{post.title}</h1>
          <p>{post.description}</p>
          {post.author ? <p className="blog-article-byline">整理 / {post.author}</p> : null}
          {post.coverImage ? <figure className="blog-article-cover"><Image alt={post.coverAlt ?? post.title} fill priority sizes="(max-width: 760px) 100vw, 720px" src={post.coverImage} /></figure> : null}
        </header>
        <MdxContent source={post.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "")} />
      </article>
    </div>
  );
}
