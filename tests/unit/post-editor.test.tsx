import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostEditor } from "@/components/studio/post-editor";
import { saveStudioPost, uploadStudioPostCover } from "@/app/studio/writing/actions";
import { importStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import type { PostDocument } from "@/lib/content";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/app/studio/writing/actions", () => ({ saveStudioPost: vi.fn(), uploadStudioPostCover: vi.fn() }));
vi.mock("@/app/studio/projects/actions", () => ({ saveStudioProjectNotes: vi.fn(), uploadStudioProjectImage: vi.fn() }));
vi.mock("@/app/studio/markdown-preview-actions", () => ({ importStudioMarkdown: vi.fn() }));
const post: PostDocument = { kind: "post", title: "第一篇 Notes", description: "已发布内容", slug: "first-note", date: "2026-10-19", tags: ["随笔"], href: "/blog/first-note", source: "## 已有正文" };
beforeEach(() => { localStorage.clear(); vi.resetAllMocks(); });
afterEach(cleanup);
describe("journal authoring workflow", () => {
  it("keeps the manuscript primary and renders the same blog structure on demand", () => {
    render(<PostEditor post={post} posts={[post]} />);
    expect(screen.getByLabelText("标题")).toHaveValue(post.title);
    expect(screen.getByLabelText("Markdown")).toHaveValue(post.source);
    expect(screen.queryByLabelText("发布设置")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^预览$/ }));
    expect(screen.queryByLabelText("Markdown")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Markdown 实时预览").querySelector(".blog-article-header h1")).toHaveTextContent(post.title);
    expect(screen.getByRole("heading", { name: /已有正文/ })).toBeVisible();
  });
  it("publishes only through the explicit publication panel", async () => {
    vi.mocked(saveStudioPost).mockResolvedValue({ ok: true, message: "ok" });
    render(<PostEditor post={post} posts={[post]} />);
    fireEvent.change(screen.getByLabelText("Markdown"), { target: { value: "## 改好的正文" } });
    expect(saveStudioPost).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /发布设置/ }));
    fireEvent.click(screen.getByRole("button", { name: "更新文章" }));
    await waitFor(() => expect(saveStudioPost).toHaveBeenCalledOnce());
    const form = vi.mocked(saveStudioPost).mock.calls[0][0];
    expect(form.get("source")).toBe("## 改好的正文");
    expect(form.get("originalSlug")).toBe("first-note");
  });
  it("imports Markdown without publishing or changing an existing public address", async () => {
    vi.mocked(importStudioMarkdown).mockResolvedValue({ metadata: { title: "导入标题", slug: "another-slug" }, source: "## 导入正文" });
    render(<PostEditor post={post} />);
    fireEvent.change(screen.getByLabelText("导入 Markdown 文件"), { target: { files: [new File(["# 导入标题"], "article.md")] } });
    await waitFor(() => expect(screen.getByLabelText("标题")).toHaveValue("导入标题"));
    fireEvent.click(screen.getByRole("button", { name: /发布设置/ }));
    expect(screen.getByLabelText("公开地址")).toHaveValue("first-note");
    expect(saveStudioPost).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "撤销导入" }));
    expect(screen.getByLabelText("Markdown")).toHaveValue(post.source);
  });
  it("restores a local draft only after an explicit choice", async () => {
    render(<PostEditor post={post} />);
    fireEvent.change(screen.getByLabelText("Markdown"), { target: { value: "还没发布的文字" } });
    fireEvent.click(screen.getByRole("button", { name: "备份草稿" }));
    cleanup();
    render(<PostEditor post={post} />);
    await screen.findByRole("button", { name: "恢复草稿" });
    expect(screen.getByLabelText("Markdown")).toHaveValue(post.source);
    fireEvent.click(screen.getByRole("button", { name: "恢复草稿" }));
    expect(screen.getByLabelText("Markdown")).toHaveValue("还没发布的文字");
    expect(saveStudioPost).not.toHaveBeenCalled();
  });
  it("keeps text and a retry action when publishing fails", async () => {
    vi.mocked(saveStudioPost).mockRejectedValue(new Error("网络中断"));
    render(<PostEditor post={post} />);
    fireEvent.click(screen.getByRole("button", { name: /发布设置/ }));
    fireEvent.click(screen.getByRole("button", { name: "更新文章" }));
    await screen.findByText("网络中断");
    expect(screen.getByLabelText("Markdown")).toHaveValue(post.source);
    expect(screen.getByRole("button", { name: "更新文章" })).toBeEnabled();
  });
  it("uploads an inline image and inserts it at the manuscript caret", async () => {
    vi.mocked(uploadStudioPostCover).mockResolvedValue({ ok: true, path: "/images/body.png" });
    render(<PostEditor post={post} />);
    fireEvent.change(screen.getByLabelText("上传正文图片"), { target: { files: [new File(["image"], "过程.png", { type: "image/png" })] } });
    await waitFor(() => expect((screen.getByLabelText("Markdown") as HTMLTextAreaElement).value).toContain("![过程](/images/body.png)"));
    expect(saveStudioPost).not.toHaveBeenCalled();
  });
});
