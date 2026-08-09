import Image from "next/image";
import type { JSX } from "react";

import { Parallax } from "@/components/exhibition/parallax";
import type { ProjectSummary } from "@/lib/content";

export function ProjectMedia({ project, sizes }: { project: ProjectSummary; sizes: string }): JSX.Element {
  const isPlaceholder = !project.coverImage;

  return (
    <figure className="project-media">
      <Parallax className="visual-camera-layer" speed={0.06}>
        <Image
          className="project-media-image"
          src={project.coverImage ?? "/images/placeholders/hero-editorial.svg"}
          alt={project.coverAlt ?? `${project.title} 项目封面`}
          fill
          sizes={sizes}
        />
      </Parallax>
      {isPlaceholder ? <span className="project-media-placeholder">IMAGE PLACEHOLDER</span> : null}
    </figure>
  );
}
