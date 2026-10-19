import { documentHeaderCover } from "@/lib/project-images";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleDocumentHeader } from "@/components/article-document-header";
import { MdxContent } from "@/components/mdx-content";
import { ArticleReadingTools } from "@/components/article-reading-tools";
import { extractArticleHeadings } from "@/lib/article";
import { getPost, getPosts } from "@/lib/published-content";
import { getPosts as getRepositoryPosts } from "@/lib/content";

export function generateStaticParams() { return getRepositoryPosts().map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
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
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const headings = extractArticleHeadings(post.source).filter((heading) => heading.text !== "目录");
  const posts = await getPosts();
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const nextPost = posts[(currentIndex + 1) % posts.length];

  return (
    <div className="blog-article-page" lang="zh-CN">
      <article className="blog-article site-container" aria-label={post.title}>
        <div className="blog-article-topline">
          <Link className="blog-back-link" href="/blog">← 返回文章目录</Link>
        </div>
        <ArticleDocumentHeader document={{ ...post, coverImage: documentHeaderCover(post.coverImage, post.source) }} />
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
