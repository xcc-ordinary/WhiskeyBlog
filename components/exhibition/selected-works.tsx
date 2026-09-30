"use client";

import Link from "next/link";
import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { ProjectMedia } from "@/components/exhibition/project-media";
import { LivingScene } from "@/components/exhibition/living-scene";

type FeaturedProject = { slug: string; coverImage: string };

export function SelectedWorks({ projects }: { projects: readonly FeaturedProject[] }): JSX.Element {
  const { content } = useLanguage();

  return <section aria-label={content.home.selectedWorkTitle} className="selected-works" id="selected-work">
    <LivingScene className="selected-works-scene" image="/images/site-backgrounds/selected-works-canvas-fade-v1.webp" mobileImage="/images/site-backgrounds/selected-works-canvas-fade-mobile-v1.webp" position="center top" scene="canvas" />
    <header className="selected-works-heading"><p className="section-label">{content.home.selectedWorkKicker}</p><h2>{content.home.selectedWorkTitle}</h2><p>{content.home.selectedWorkSummary}</p></header>
    <div className="selected-works-grid">{projects.map((project, index) => {
      const copy = content.home.projects[index];
      return <Link className={`selected-work-card selected-work-card-${index + 1}`} href={`/projects/${project.slug}`} key={project.slug}>
        <ProjectMedia project={{ ...project, title: copy.title, description: copy.description, date: "2026-09-17", tags: [], kind: "project", href: `/projects/${project.slug}`, coverAlt: copy.alt }} sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1200px) 48vw, 700px" />
        <div className="selected-work-card-copy"><small className="selected-work-index">{String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</small><h3>{copy.title}</h3><p>{copy.description}</p><small className="selected-work-stack">{copy.tags}</small></div>
      </Link>;
    })}</div>
  </section>;
}
