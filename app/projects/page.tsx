import Image from "next/image";
import Link from "next/link";

import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { getProjects } from "@/lib/content";

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <><ExplorerHero eyebrow="03 / AIRSHIP YARD" title="项目，是驶向未知的装置。" description="从背景、过程到结果，记录每一次建造如何让想法获得自己的航向。" image="/images/site-backgrounds/projects-airshipyard-v2.png" /><section className="projects-index site-container">
      <header className="projects-index-heading">
        <p className="section-label">精选项目 / 案例研究</p>
        <h1>项目不是陈列品，<br />而是做出选择的过程。</h1>
        <p>从背景、过程到结果，记录每个项目如何被理解、被构建，也如何让我继续成长。</p>
      </header>
      <div className="projects-editorial-list">
        {projects.map((project, index) => (
          <article className={`projects-editorial-item projects-editorial-item-${(index % 3) + 1}`} key={project.slug}>
            <Link href={project.href}>
              <figure>
                <div className="projects-editorial-frame">
                  <Image
                    alt={project.coverAlt ?? (project.coverImage ? `${project.title} 项目封面` : `${project.title} 项目封面占位图`)}
                    className="projects-editorial-image"
                    fill
                    sizes="(max-width: 760px) calc(100vw - 32px), 62vw"
                    src={project.coverImage ?? "/images/placeholders/hero-editorial.svg"}
                  />
                </div>
                <figcaption>{project.date.slice(0, 4)} · {project.tags.join(" / ")}</figcaption>
              </figure>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <span className="projects-editorial-link">查看案例研究 →</span>
            </Link>
          </article>
        ))}
      </div>
    </section></>
  );
}
