import Image from "next/image";
import Link from "next/link";

import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { getProjects } from "@/lib/content";

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="projects-page">
      <ExplorerHero eyebrow="03 / AIRSHIP YARD" title="项目，是驶向未知的装置。" description="从背景、过程到结果，记录每一次建造如何让想法获得自己的航向。" image="/images/site-backgrounds/projects-airshipyard-v2.png" />
      <div className="projects-index painted-index-transition">
        <div className="projects-index-canvas site-container">
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
                        loading={index === 0 ? "eager" : "lazy"}
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
        </div>
      </div>
    </div>
  );
}
