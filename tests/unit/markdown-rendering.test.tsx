// @vitest-environment node
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MdxContent } from "@/components/mdx-content";
import { extractArticleHeadings } from "@/lib/article";
vi.mock("server-only", () => ({}));

const source = readFileSync("tests/fixtures/markdown-reading.md", "utf8");
describe("shared Obsidian-style Markdown rendering", () => {
  it("preserves GFM, callouts, math, HTML tables, code, images and footnotes", async () => {
    const html = renderToStaticMarkup(await MdxContent({ source }));
    expect(html).toContain('class="prose markdown-document"');
    expect(html).toContain("<mark>值得记住的高亮</mark>");
    expect(html).toContain("<del>失效信息</del>");
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html.match(/<table/g)).toHaveLength(2);
    expect(html).toContain('data-callout="note"');
    expect(html).toContain('data-callout="warning"');
    expect(html).toContain("<details");
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="hljs-keyword"');
    expect(html).toContain('width="240"');
    expect(html).toContain('href="/blog/codex-guide"');
    expect(html).toContain('class="article-unresolved-link"');
    expect(html).toContain("data-footnote-ref");
    expect(html).not.toContain("这段注释不应显示");
    expect(html).toContain("==这里不是高亮== [[这里不是内链]]");
  });
  it("matches unique heading anchors and ignores fenced sample headings", async () => {
    const headings = extractArticleHeadings(source);
    expect(headings.filter(item => item.text === "重复标题").map(item => item.id)).toEqual(["重复标题", "重复标题-1"]);
    expect(headings.some(item => item.text === "这不是正文标题")).toBe(false);
    const html = renderToStaticMarkup(await MdxContent({ source }));
    for (const heading of headings) expect(html).toContain(`id="${heading.id}"`);
  });
  it("renders literal braces as text and strips executable HTML and dangerous URLs", async () => {
    const html = renderToStaticMarkup(await MdxContent({ source: '普通文本 {value}。\n\n<script>alert(1)</script>\n\n[坏链接](javascript:alert%281%29)\n\n<img src="/images/a.png" onerror="alert(1)">\n\n<iframe src="https://example.test"></iframe>' }));
    expect(html).toContain("{value}");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<iframe");
  });
  it("hides comments across paragraphs while retaining literal code and block anchors", async () => {
    const source = '保留\n\n%%隐去 **加粗**\n\n## 私密标题\n\n尾巴%%\n\n公开段落 ^block-one\n\n```text\n%%代码原样%%\n```';
    const html = renderToStaticMarkup(await MdxContent({ source }));
    expect(html).not.toContain("隐去");
    expect(html).not.toContain("私密标题");
    expect(html).toContain('id="block-one"');
    expect(html).not.toContain("^block-one");
    expect(html).toContain("%%代码原样%%");
    expect(extractArticleHeadings(source)).toEqual([]);
  });
});
