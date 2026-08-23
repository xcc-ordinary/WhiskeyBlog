import Link from "next/link";
import type { JSX } from "react";

import { ProjectMedia } from "@/components/exhibition/project-media";
import type { ProjectSummary } from "@/lib/content";

export function SelectedWorks({ projects }: { projects: ProjectSummary[] }): JSX.Element {
  return <section aria-label="精选项目" className="selected-works" id="selected-work">
    <header className="selected-works-heading"><p className="section-label">02 / SELECTED WORK</p><h2>精选项目</h2></header>
    <div className="selected-works-grid">{projects.slice(0, 3).map((project, index) => <Link className={`selected-work-card selected-work-card-${index + 1}`} href={project.href} key={project.slug}><ProjectMedia project={project} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 42vw" /><span className="selected-work-card-copy"><small className="selected-work-index">{String(index + 1).padStart(2, "0")} / 03</small><strong>{project.title}</strong><span>{project.description}</span><small className="selected-work-stack">{project.tags.join(" / ")} <b aria-hidden="true">↗</b></small></span></Link>)}</div>
  </section>;
}
