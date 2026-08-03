import Image from "next/image";
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
    <article className="project-case site-container">
      <header className="project-case-heading">
        <p className="section-label">案例研究 / {project.date.slice(0, 4)}</p>
        <h1>{project.title}</h1>
        <p>{project.description}</p>
      </header>

      <figure className="project-case-cover">
        <div className="project-case-cover-frame">
          <Image
            alt={project.coverAlt ?? (project.coverImage ? `${project.title} 项目封面` : `${project.title} 项目封面占位图`)}
            fill
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), 1120px"
            src={project.coverImage ?? "/images/placeholders/hero-editorial.svg"}
          />
        </div>
        <figcaption>{project.title} / {project.date.slice(0, 4)}</figcaption>
      </figure>

      <dl className="project-case-facts">
        <div><dt>年份</dt><dd>{project.date.slice(0, 4)}</dd></div>
        <div><dt>类型</dt><dd>{projectType || <MissingProjectFact />}</dd></div>
        <div><dt>角色</dt><dd>{project.role || <MissingProjectFact />}</dd></div>
      </dl>

      <div className="project-case-story">
        <section>
          <p className="section-label">01 / 背景</p>
          <h2>背景</h2>
          <p>{project.description}</p>
        </section>
        <section aria-label="待补充的项目资料" className="project-placeholder-region">
          <div>
            <p className="section-label">02 / 过程</p>
            <h2>过程</h2>
            <p><MissingProjectFact /></p>
          </div>
          <div>
            <p className="section-label">03 / 关键结果</p>
            <h2>关键结果</h2>
            <p><MissingProjectFact /></p>
          </div>
        </section>
        <section className="project-case-notes">
          <p className="section-label">04 / 项目笔记</p>
          <MdxContent source={project.source} />
        </section>
      </div>

      <ProjectCaseStudyNav currentSlug={project.slug} projects={projects} />
    </article>
  );
}
