import Link from "next/link";
import type { JSX } from "react";

import { ProjectMedia } from "@/components/exhibition/project-media";
import type { ProjectSummary } from "@/lib/content";

export function SelectedWorks({ projects }: { projects: ProjectSummary[] }): JSX.Element {
  return <section aria-label="Selected work" className="selected-works" id="selected-work"><p className="section-label">02 / SELECTED WORK</p>{projects.slice(0, 3).map((project, index) => <Link className={`work-piece work-piece-${index + 1}`} href={`/projects/${project.slug}`} key={project.slug}><ProjectMedia project={project} sizes="(max-width: 760px) 100vw, 60vw" /><span>{project.title}</span><small>{project.date.slice(0, 4)} · {project.tags.join(" / ")}</small></Link>)}</section>;
}
