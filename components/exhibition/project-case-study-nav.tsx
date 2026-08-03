import Link from "next/link";
import type { JSX } from "react";

import type { ProjectSummary } from "@/lib/content";

export function ProjectCaseStudyNav({ projects, currentSlug }: { projects: ProjectSummary[]; currentSlug: string }): JSX.Element | null {
  const currentIndex = projects.findIndex((project) => project.slug === currentSlug);
  if (currentIndex === -1) return null;

  const previous = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const next = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;
  if (!previous && !next) return null;

  return (
    <nav aria-label="项目导航" className="project-case-nav">
      {previous ? (
        <Link className="project-case-nav-previous" href={previous.href} rel="prev">
          <small>上一项目</small>
          <span>← {previous.title}</span>
        </Link>
      ) : <span aria-hidden="true" />}
      {next ? (
        <Link className="project-case-nav-next" href={next.href} rel="next">
          <small>下一项目</small>
          <span>{next.title} →</span>
        </Link>
      ) : null}
    </nav>
  );
}
