import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "@/components/studio/markdown-preview";
import { MdxContent } from "@/components/mdx-content";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/lib/note-links", () => ({ publishedNoteLinks: async () => ({}) }));
afterEach(cleanup);
describe("shared journal preview", () => {
  it("updates immediately without a server preview request", () => {
    const { rerender } = render(<MarkdownPreview source="## 旧版" />);
    rerender(<MarkdownPreview source="## 最新版" />);
    expect(screen.getByRole("heading", { name: /最新版/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /旧版/ })).not.toBeInTheDocument();
  });
  it("uses the identical safe Markdown markup as the published blog", async () => {
    const source = "## 正文\n\n> [!note] 记录\n> 共享样式。\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [x] 完成\n\n<script>alert(1)</script>";
    const server = renderToStaticMarkup(await MdxContent({ source }));
    const { container } = render(<MarkdownPreview source={source} />);
    const template = document.createElement("template"); template.innerHTML = server;
    expect(container.querySelector(".markdown-document")?.isEqualNode(template.content.firstElementChild)).toBe(true);
    expect(container.querySelector("script")).toBeNull();
  });
});
