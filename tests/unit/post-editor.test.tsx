import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostEditor } from "@/components/studio/post-editor";
import type { PostDocument, PostSummary } from "@/lib/content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/app/studio/writing/actions", () => ({
  saveStudioPost: vi.fn(),
  uploadStudioPostCover: vi.fn(),
}));

afterEach(cleanup);

const posts: PostSummary[] = [{
  kind: "post",
  title: "第一篇 Notes",
  description: "已发布的内容",
  slug: "first-note",
  date: "2026-08-20",
  tags: ["随笔"],
  href: "/blog/first-note",
}];

const post: PostDocument = { ...posts[0], source: "# 已有正文" };

describe("PostEditor", () => {
  it("lets the owner select and edit an existing Note", () => {
    render(<PostEditor post={post} posts={posts} />);

    expect(screen.getByLabelText("选择 Notes")).toHaveValue("first-note");
    expect(screen.getByLabelText("标题")).toHaveValue("第一篇 Notes");
    expect(screen.getByLabelText("Markdown")).toHaveValue("# 已有正文");
    expect(screen.getByRole("button", { name: "保存 Notes" })).toBeTruthy();
  });

  it("supports distraction-free writing and preview modes", () => {
    render(<PostEditor post={post} posts={posts} />);

    fireEvent.click(screen.getByRole("button", { name: "仅写作" }));
    expect(screen.getByLabelText("Markdown")).toBeVisible();
    expect(screen.queryByLabelText("Markdown 实时预览")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "仅预览" }));
    expect(screen.queryByLabelText("Markdown")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Markdown 实时预览")).toBeVisible();
  });
});
