import Link from "next/link";
import type { ProjectSummary } from "@/lib/content";
export function ProjectCard({ project }: { project: ProjectSummary }) { return <article className="content-card"><p>{project.date}</p><h2><Link href={project.href}>{project.title}</Link></h2><p>{project.description}</p><ul className="tag-list">{project.tags.map((tag) => <li className="tag" key={tag}>{tag}</li>)}</ul></article>; }
