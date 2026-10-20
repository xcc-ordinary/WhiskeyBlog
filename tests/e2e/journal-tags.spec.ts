import { expect, test } from "@playwright/test";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

test("a footer hashtag creates a category and supports exact or parent-tag searching", async ({ page, baseURL }) => {
  test.skip(!baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Local fixture only");
  const slug = `tag-check-${crypto.randomUUID()}`;
  const file = path.join(process.cwd(), "content/posts", `${slug}.mdx`);
  try {
    await writeFile(file, `---\ntitle: "文末标签验证"\ndescription: "从正文标签到目录的完整链路"\nslug: "${slug}"\ndate: "2026-10-20"\ntags: []\n---\n\n正文。\n\n\x60\x60\x60sh\n#not-a-category\n\x60\x60\x60\n\n#todo #研究/交互\n`, { flag: "wx" });
    await page.goto("/blog");
    await page.getByRole("toolbar", { name: "按分类筛选文章" }).getByRole("button", { name: "#todo", exact: true }).click();
    await expect(page.locator(`.notes-directory a[href="/blog/${slug}"]`)).toBeVisible();
    await expect(page.getByRole("button", { name: "#not-a-category", exact: true })).toHaveCount(0);
    await page.getByRole("searchbox", { name: "搜索文章" }).fill("#研究");
    await expect(page.locator(".notes-directory>li")).toHaveCount(1);
    await expect(page.locator(".notes-directory")).toContainText("文末标签验证");
    await page.getByRole("searchbox", { name: "搜索文章" }).fill("#to");
    await expect(page.locator(".notes-directory>li")).toHaveCount(0);
  } finally { await unlink(file).catch(() => {}); }
});

test("home work frames are equal across differently proportioned images", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const sizes = await page.locator(".edition-teaser-image").evaluateAll(elements => elements.map(element => ({ width: element.clientWidth, height: element.clientHeight })));
    expect(sizes.length).toBeGreaterThan(1);
    for (const size of sizes) {
      expect(Math.abs(size.width - sizes[0].width)).toBeLessThanOrEqual(1);
      expect(Math.abs(size.height - sizes[0].height)).toBeLessThanOrEqual(1);
      expect(Math.abs(size.width / size.height - 1.5)).toBeLessThan(.02);
    }
  }
});
