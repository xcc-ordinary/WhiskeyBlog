import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCaseStudyNav } from "@/components/exhibition/project-case-study-nav";
import { MdxContent } from "@/components/mdx-content";
import { ArticleReadingTools, ArticleShareButton } from "@/components/article-reading-tools";
import { extractArticleHeadings, estimateReadingMinutes } from "@/lib/article";
import "./project-article.css";
import { getProject, getProjects } from "@/lib/content";

export function generateStaticParams() {
  return getProjects().map(({ slug }) => ({ slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const projects = getProjects();
  const project = getProject((await params).slug);
  if (!project) notFound();

  const source = project.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "");
  const headings = extractArticleHeadings(source).filter(heading => heading.text !== "目录");

  return (
    <div className="blog-article-page project-article-page" lang="zh-CN">
      <article className="blog-article project-article site-container" aria-labelledby="article-title">
        <div className="blog-article-topline">
          <Link className="blog-back-link" href="/projects">← 返回项目目录</Link>
        </div>
        <header className="blog-article-header">
          <p className="section-label">PROJECT / {project.date.slice(0, 4)}{project.tags.length ? ` · ${project.tags.join(" / ")}` : ""}</p>
          <h1 id="article-title">{project.title}</h1>
          <p className="blog-article-deck">{project.description}</p>
          <div className="blog-article-meta">
            <p><strong>{project.role || "Whiskey"}</strong><span>{project.date.replaceAll("-", ".")} · {estimateReadingMinutes(source)} 分钟阅读</span></p>
            <ArticleShareButton title={project.title} />
          </div>
          {project.coverImage ? <figure className="blog-article-cover project-article-cover">
            <Image alt={project.coverAlt ?? `${project.title} 项目封面`} src={project.coverImage} width={1600} height={1067} priority sizes="(max-width: 760px) calc(100vw - 40px), 900px" />
          </figure> : null}
        </header>
        <ArticleReadingTools headings={headings} />
        <div className="blog-article-reading-layout"><MdxContent source={source} /></div>
        <ProjectCaseStudyNav currentSlug={project.slug} projects={projects} />
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return { title: "项目未找到" };
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: project.href },
    openGraph: {
      title: project.title,
      description: project.description,
      ...(project.coverImage ? { images: [{ url: project.coverImage, alt: project.coverAlt ?? project.title }] } : {}),
    },
  };
}
