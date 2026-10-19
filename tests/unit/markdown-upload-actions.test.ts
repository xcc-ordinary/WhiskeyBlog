// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { importStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import { requireOwner } from "@/lib/supabase/auth";
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: vi.fn() }));
afterEach(() => vi.resetAllMocks());
describe("owner Markdown import", () => {
  it("parses a real Markdown upload without publishing it", async () => {
    const form = new FormData(); form.set("document", new File(['---\ntitle: 一页记录\ntags: [生活]\n---\n\n## 正文'], "note.md"));
    expect(await importStudioMarkdown(form)).toMatchObject({ metadata: { title: "一页记录", tags: "生活" }, source: "## 正文" });
    expect(requireOwner).toHaveBeenCalledOnce();
  });
  it("requires the owner before reading an uploaded document", async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error("Sign in required"));
    await expect(importStudioMarkdown(new FormData())).rejects.toThrow("Sign in required");
  });
  it("rejects other formats and empty files", async () => {
    for (const [name, text] of [["page.html", "<html>"], ["empty.md", ""]]) {
      const form = new FormData(); form.set("document", new File([text], name));
      await expect(importStudioMarkdown(form)).rejects.toThrow();
    }
  });
});
