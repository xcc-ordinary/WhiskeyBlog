import type { ProjectSummary } from "@/lib/content";

export function featuredProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return projects.filter(project => project.featured !== false).slice().sort((a, b) =>
    (a.homeOrder ?? 999) - (b.homeOrder ?? 999) || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
