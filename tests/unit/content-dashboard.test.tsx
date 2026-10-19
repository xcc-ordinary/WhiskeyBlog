import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it } from "vitest";
import { ContentDashboard } from "@/components/studio/content-dashboard";
afterEach(cleanup);
it("filters immediately and switches between editable projects and Notes", () => {
  render(<ContentDashboard writable projects={[{ kind: "project", slug: "work", title: "Lumi", description: "AI 工具", date: "2026-10-17", tags: ["AI"], href: "/projects/work", featured: true }]} posts={[{ kind: "post", slug: "note", title: "日记", description: "记录日常", date: "2026-10-17", tags: ["生活"], href: "/blog/note" }]} />);
  expect(screen.getByRole("link", { name: "编辑Lumi" })).toHaveAttribute("href", "/studio/projects?project=work");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });
  expect(screen.getByText("没有匹配的内容")).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Notes 1" }));
  expect(screen.getByRole("searchbox")).toHaveValue("");
  expect(screen.getByRole("link", { name: "编辑日记" })).toHaveAttribute("href", "/studio/writing?post=note");
  expect(screen.getByRole("link", { name: /新建 Notes/ })).toHaveAttribute("href", "/studio/writing?mode=new");
});
