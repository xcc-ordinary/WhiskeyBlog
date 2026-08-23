import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { ProjectNotesEditor } from "@/components/studio/project-notes-editor";
import type { ProjectDocument, ProjectSummary } from "@/lib/content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/app/studio/projects/actions", () => ({
  saveStudioProjectNotes: vi.fn(),
}));

const projects: ProjectSummary[] = [{
  kind: "project",
  title: "WhiskeyBlog",
  description: "个人网站",
  slug: "whiskey-blog",
  date: "2026-08-20",
  tags: ["Next.js"],
  href: "/projects/whiskey-blog",
  role: "设计与开发",
}];

const project: ProjectDocument = { ...projects[0], source: "## 项目过程" };

describe("ProjectNotesEditor", () => {
  it("lets the owner select and edit an existing project", () => {
    render(<ProjectNotesEditor project={project} projects={projects} />);

    expect(screen.getByLabelText("选择项目")).toHaveValue("whiskey-blog");
    expect(screen.getByLabelText("项目名称")).toHaveValue("WhiskeyBlog");
    expect(screen.getByLabelText("项目笔记（Markdown）")).toHaveValue("## 项目过程");
    expect(screen.getByRole("link", { name: "新建项目" })).toHaveAttribute("href", "/studio/projects?mode=new");
    expect(screen.getByRole("button", { name: "保存项目" })).toBeTruthy();
  });
});
