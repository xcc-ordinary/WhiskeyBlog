"use client";

import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { ProjectMedia } from "@/components/exhibition/project-media";

type FeaturedProject = { slug: string; coverImage: string };

export function SelectedWorks({ projects }: { projects: readonly FeaturedProject[] }): JSX.Element {
  const { content } = useLanguage();

  return <section aria-label={content.home.selectedWorkTitle} className="selected-works" id="selected-work">
    <header className="selected-works-heading"><p className="section-label">{content.home.selectedWorkKicker}</p><h2>{content.home.selectedWorkTitle}</h2><p>{content.home.selectedWorkSummary}</p></header>
    <div className="selected-works-grid">{projects.map((project, index) => {
      const copy = content.home.projects[index];
      return <article className={`selected-work-card selected-work-card-${index + 1}`} key={project.slug}>
        <ProjectMedia project={{ ...project, title: copy.title, description: copy.description, date: "2026-09-17", tags: [], kind: "project", href: "/projects", coverAlt: copy.alt }} sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1200px) 48vw, 700px" />
        <div className="selected-work-card-copy"><small className="selected-work-index">{String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</small><h3>{copy.title}</h3><p>{copy.description}</p><small className="selected-work-stack">{copy.tags}</small></div>
      </article>;
    })}</div>
  </section>;
}
