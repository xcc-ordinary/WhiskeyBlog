import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveStudioProjectNotes, uploadStudioProjectImage } from "@/app/studio/projects/actions";

import { ProjectNotesEditor } from "@/components/studio/project-notes-editor";
import type { ProjectDocument, ProjectSummary } from "@/lib/content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/app/studio/projects/actions", () => ({
  saveStudioProjectNotes: vi.fn(),
  uploadStudioProjectImage: vi.fn(),
}));
vi.mock("@/app/studio/markdown-preview-actions", () => ({ renderStudioMarkdown: vi.fn().mockResolvedValue(null) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const projects: ProjectSummary[] = [{
  kind: "project",
  title: "WhiskeyBlog",
  description: "个人网站",
  slug: "whiskey-blog",
  date: "2026-08-20",
  tags: ["Next.js"],
  href: "/projects/whiskey-blog",
  role: "设计与开发",
  featured: false,
}];

const project: ProjectDocument = { ...projects[0], source: "## 项目过程" };

describe("ProjectNotesEditor", () => {
  it("saves homepage selection and ordering with project metadata", async () => {
    vi.mocked(saveStudioProjectNotes).mockResolvedValue({ ok: true, message: "已保存" });
    render(<ProjectNotesEditor project={project} projects={projects} />);
    fireEvent.click(screen.getByLabelText("在首页展示此项目"));
    fireEvent.change(screen.getByLabelText(/首页排序/), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "保存项目" }));
    await waitFor(() => expect(saveStudioProjectNotes).toHaveBeenCalledOnce());
    const form = vi.mocked(saveStudioProjectNotes).mock.calls[0][0];
    expect(form.get("featured")).toBe("true");
    expect(form.get("homeOrder")).toBe("3");
    await screen.findByText("已保存");
  });

  it("uploads a cover then includes its path in the saved project", async () => {
    vi.mocked(uploadStudioProjectImage).mockResolvedValue({ ok: true, path: "/images/projects/uploads/test.png" });
    vi.mocked(saveStudioProjectNotes).mockResolvedValue({ ok: true, message: "已保存" });
    render(<ProjectNotesEditor project={project} projects={projects} />);
    fireEvent.change(screen.getByLabelText(/上传项目封面/), { target: { files: [new File(["image"], "cover.png", { type: "image/png" })] } });
    await waitFor(() => expect(screen.getByLabelText("封面地址")).toHaveValue("/images/projects/uploads/test.png"));
    fireEvent.click(screen.getByRole("button", { name: "保存项目" }));
    await waitFor(() => expect(saveStudioProjectNotes).toHaveBeenCalledOnce());
    expect(vi.mocked(saveStudioProjectNotes).mock.calls[0][0].get("coverImage")).toBe("/images/projects/uploads/test.png");
    await screen.findByText("已保存");
  });

  it("appends an uploaded body image and preserves text when saving fails", async () => {
    vi.mocked(uploadStudioProjectImage).mockResolvedValue({ ok: true, path: "/images/projects/uploads/body.webp" });
    vi.mocked(saveStudioProjectNotes).mockRejectedValue(new Error("offline"));
    render(<ProjectNotesEditor project={project} projects={projects} />);
    fireEvent.change(screen.getByLabelText(/插入正文图片/), { target: { files: [new File(["image"], "detail.webp", { type: "image/webp" })] } });
    await waitFor(() => expect(screen.getByLabelText("项目笔记（Markdown）")).toHaveValue("## 项目过程\n\n![detail](/images/projects/uploads/body.webp)\n\n"));
    fireEvent.click(screen.getByRole("button", { name: "保存项目" }));
    await screen.findByText("保存请求未完成，内容仍保留在编辑器中，请重试。");
    expect(screen.getByRole("button", { name: "保存项目" })).toBeEnabled();
    expect((screen.getByLabelText("项目笔记（Markdown）") as HTMLTextAreaElement).value).toContain("![detail]");
  });

  it("lets the owner select and edit an existing project", () => {
    render(<ProjectNotesEditor project={project} projects={projects} />);

    expect(screen.getByLabelText("选择项目")).toHaveValue("whiskey-blog");
    expect(screen.getByLabelText("项目名称")).toHaveValue("WhiskeyBlog");
    expect(screen.getByLabelText("项目笔记（Markdown）")).toHaveValue("## 项目过程");
    expect(screen.getByRole("link", { name: "新建项目" })).toHaveAttribute("href", "/studio/projects?mode=new");
    expect(screen.getByRole("button", { name: "保存项目" })).toBeTruthy();
  });
});
