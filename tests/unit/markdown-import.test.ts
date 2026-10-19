// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseMarkdownUpload } from "@/lib/markdown-import";
describe("Markdown document import", () => {
  it("reads YAML metadata and preserves the original Markdown", () => {
    const imported = parseMarkdownUpload('---\ntitle: 导入文章\ndate: 2026-10-19\ntags: [设计, 实践]\nslug: my-note\nfeatured: false\n---\n\n## 正文\n\n**原来的表达**', "note.md");
    expect(imported.metadata).toMatchObject({ title: "导入文章", date: "2026-10-19", tags: "设计, 实践", slug: "my-note", featured: "false" });
    expect(imported.source).toBe("## 正文\n\n**原来的表达**");
  });
  it("imports a normal Markdown file using its title and first paragraph", () => {
    expect(parseMarkdownUpload("\uFEFF# 一点观察\n\n这是第一段。\n\n## 过程", "my-note.md")).toMatchObject({ metadata: { title: "一点观察", description: "这是第一段。", slug: "my-note" } });
  });
  it("rejects executable frontmatter without running it", () => {
    expect(() => parseMarkdownUpload("---js\nthrow new Error('executed')\n---", "bad.mdx")).toThrow("仅支持 YAML");
  });
  it("rejects an oversized source", () => {
    expect(() => parseMarkdownUpload("x".repeat(200_001), "large.md")).toThrow("200,000");
  });
});
