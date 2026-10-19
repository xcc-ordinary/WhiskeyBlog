import { describe, expect, it } from "vitest";
import { featuredProjects } from "@/lib/featured-projects";
import type { ProjectSummary } from "@/lib/content";

const project = (slug: string, featured?: boolean, homeOrder?: number): ProjectSummary => ({ kind: "project", slug, title: slug, description: "description", date: "2026-10-17", tags: [], href: `/projects/${slug}`, featured, homeOrder });
describe("homepage project selection", () => {
  it("uses only selected projects in editorial order without mutating the directory", () => {
    const projects = [project("later", true, 4), project("hidden", false, 0), project("first", true, 1), project("unset", true)];
    expect(featuredProjects(projects).map(item => item.slug)).toEqual(["first", "later", "unset"]);
    expect(projects[0].slug).toBe("later");
    expect(featuredProjects([])).toEqual([]);
  });
  it("automatically includes projects with no manual homepage flag", () => {
    expect(featuredProjects([project("new"), project("hidden", false)]).map(item => item.slug)).toEqual(["new"]);
  });
});
