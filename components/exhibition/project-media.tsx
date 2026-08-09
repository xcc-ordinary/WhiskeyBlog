import Image from "next/image";
import type { JSX } from "react";

import type { ProjectSummary } from "@/lib/content";

export function ProjectMedia({ project, sizes }: { project: ProjectSummary; sizes: string }): JSX.Element {
  const isPlaceholder = !project.coverImage;

  return (
    <figure className="project-media">
      <Image
        className="project-media-image"
        src={project.coverImage ?? "/images/placeholders/hero-editorial.svg"}
        alt={project.coverAlt ?? `${project.title} 项目封面`}
        fill
        sizes={sizes}
      />
      {isPlaceholder ? <span className="project-media-placeholder">IMAGE PLACEHOLDER</span> : null}
    </figure>
  );
}
