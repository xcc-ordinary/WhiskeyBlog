import { expect, test } from "@playwright/test";
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

test.describe("readable complete Markdown", () => {
  const slug = `reading-check-${crypto.randomUUID()}`;
  const file = path.join(process.cwd(), "content/projects", `${slug}.mdx`);
  test.beforeAll(async () => {
    const source = await readFile("tests/fixtures/markdown-reading.md", "utf8");
    await writeFile(file, `---\ntitle: "Markdown 阅读验收"\ndescription: "阅读排版与语法完整性验证。"\ndate: "2026-10-18"\nslug: "${slug}"\ntags: ["阅读"]\nfeatured: false\ncoverImage: ""\n---\n\n${source}`, { flag: "wx" });
  });
  test.afterAll(async () => { await unlink(file).catch(() => {}); });
  test("renders tables, tasks, callouts, formulas, diagrams and highlighted copyable code", async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/projects/${slug}`);
    const prose = page.locator(".markdown-document");
    await expect(prose.locator("table")).toHaveCount(2);
    await expect(prose.locator('input[type="checkbox"]')).toHaveCount(2);
    await expect(prose.locator("mark")).toHaveText("值得记住的高亮");
    await expect(prose.locator(".katex")).toHaveCount(2);
    await expect(prose.locator(".hljs-keyword").first()).toHaveText("function");
    await expect(prose.locator('.article-mermaid svg')).toBeAttached({ timeout: 60_000 });
    await expect.poll(() => prose.locator('.article-mermaid svg').evaluate(svg => {
      const frame = svg.getBoundingClientRect();
      return [...svg.querySelectorAll('g.node')].every(node => {
        const box = node.getBoundingClientRect();
        return box.width >= 50 && box.height >= 25 && box.left >= frame.left - 1 && box.right <= frame.right + 1 && box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1;
      });
    })).toBe(true);
    await prose.locator('.article-mermaid').screenshot({ path: "design/reading-2026-10-18/mermaid-readable.png" });
    const folded = prose.locator('details[data-callout="warning"]');
    await expect(folded).not.toHaveAttribute("open");
    await folded.locator("summary").click();
    await expect(folded).toHaveAttribute("open", "");
    await expect(folded).toContainText("默认折叠的内容");
    await expect(prose.getByRole("link", { name: "安装指南" })).toHaveAttribute("href", "/blog/codex-guide");
    const image = prose.locator('img[width="240"]');
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(element => (element as HTMLImageElement).decode());
    expect((await image.boundingBox())!.width).toBeLessThanOrEqual(240);
    await expect(prose).not.toContainText("这段注释不应显示");
    await page.screenshot({ path: "design/reading-2026-10-18/markdown-features-desktop.png", fullPage: true });
  });
  test("keeps text readable and complex content inside the viewport on desktop and phones", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/projects/${slug}`);
      const prose = page.locator(".markdown-document");
      await expect(prose).toHaveCSS("font-size", width > 760 ? "18px" : "17px");
      expect(await prose.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(700);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(prose.locator('h2[id="重复标题-1"]')).toHaveCount(1);
      await expect(prose.locator("h2")).not.toContainText(["这不是正文标题"]);
      await page.screenshot({ path: `design/reading-2026-10-18/markdown-${width}.png` });
    }
  });
});
