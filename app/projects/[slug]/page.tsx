import { documentHeaderCover } from "@/lib/project-images";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCaseStudyNav } from "@/components/exhibition/project-case-study-nav";
import { ArticleDocumentHeader } from "@/components/article-document-header";
import { MdxContent } from "@/components/mdx-content";
import { ArticleReadingTools } from "@/components/article-reading-tools";
import { extractArticleHeadings, estimateReadingMinutes } from "@/lib/article";
import "./project-article.css";
import { getProject, getProjects } from "@/lib/published-content";
import { getProjects as getRepositoryProjects } from "@/lib/content";

export function generateStaticParams() {
  return getRepositoryProjects().map(({ slug }) => ({ slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const projects = await getProjects();
  const project = await getProject((await params).slug);
  if (!project) notFound();

  const source = project.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "");
  const headings = extractArticleHeadings(source).filter(heading => heading.text !== "目录");

  return (
    <div className="blog-article-page project-article-page" lang="zh-CN">
      <article className="blog-article project-article site-container" aria-labelledby="article-title">
        <div className="blog-article-topline">
          <Link className="blog-back-link" href="/projects">← 返回项目目录</Link>
        </div>
        <ArticleDocumentHeader kind="project" document={{ ...project, coverImage: documentHeaderCover(project.coverImage, source), author: project.role || "Whiskey", readingMinutes: estimateReadingMinutes(source) }} />
        <ArticleReadingTools headings={headings} />
        <div className="blog-article-reading-layout"><MdxContent source={source} /></div>
        <ProjectCaseStudyNav currentSlug={project.slug} projects={projects} />
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = await getProject((await params).slug);
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
