import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/project-card";

describe("ProjectCard", () => {
  it("links to its project detail page", () => {
    render(<ProjectCard project={{ title: "WhiskeyBlog", description: "个人网站", date: "2026-07-21", tags: ["Next.js"], slug: "whiskey-blog", kind: "project", href: "/projects/whiskey-blog" }} />);
    expect(screen.getByRole("link", { name: "WhiskeyBlog" }).getAttribute("href")).toBe("/projects/whiskey-blog");
  });
});
