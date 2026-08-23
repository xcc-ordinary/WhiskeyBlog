import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCaseStudyNav } from "@/components/exhibition/project-case-study-nav";
import { MdxContent } from "@/components/mdx-content";
import { getProject, getProjects } from "@/lib/content";

export function generateStaticParams() {
  return getProjects().map(({ slug }) => ({ slug }));
}

function MissingProjectFact() {
  return <span className="project-fact-placeholder">待补充</span>;
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const projects = getProjects();
  const project = getProject((await params).slug);
  if (!project) notFound();

  const projectType = project.tags.join(" / ");

  return (
    <div className="project-case-page">
      <article className="project-case site-container">
        <header className="project-case-heading">
          <Link className="project-case-back" href="/projects">← 返回项目</Link>
          <div className="project-case-intro">
            <p className="section-label">案例研究 / {project.date.slice(0, 4)}</p>
            <h1>{project.title}</h1>
            <p>{project.description}</p>
          </div>
          <figure className="project-case-cover">
            <div className="project-case-cover-frame">
              <Image
                alt={project.coverAlt ?? (project.coverImage ? `${project.title} 项目封面` : `${project.title} 项目封面占位图`)}
                fill
                priority
                sizes="(max-width: 760px) calc(100vw - 32px), 420px"
                src={project.coverImage ?? "/images/placeholders/hero-editorial.svg"}
              />
            </div>
            <figcaption>{project.title} / {project.date.slice(0, 4)}</figcaption>
          </figure>
        </header>

        <dl className="project-case-facts">
          <div><dt>年份</dt><dd>{project.date.slice(0, 4)}</dd></div>
          <div><dt>类型</dt><dd>{projectType || <MissingProjectFact />}</dd></div>
          <div><dt>角色</dt><dd>{project.role || <MissingProjectFact />}</dd></div>
        </dl>

        <div className="project-case-story">
          <section className="project-case-overview">
            <h2 className="section-label">项目概述</h2>
            <p>{project.description}</p>
          </section>
          <section className="project-case-notes">
            <h2 className="section-label">项目笔记</h2>
            <MdxContent source={project.source.replace(/^\s*#\s+[^\n]+\r?\n+/, "")} />
          </section>
        </div>

        <ProjectCaseStudyNav currentSlug={project.slug} projects={projects} />
      </article>
    </div>
  );
}
