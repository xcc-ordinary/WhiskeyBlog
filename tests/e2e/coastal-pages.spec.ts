import { expect, test } from "@playwright/test";

test("project detail shares Notes reading layout and displays the complete cover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/lumi");
  const article = page.getByRole("article", { name: "Lumi", exact: true });
  await expect(article).toHaveClass(/blog-article/);
  await expect(page.locator(".blog-article-meta")).toContainText("2026.09.17");
  await expect(page.locator(".blog-article-meta")).toContainText("分钟阅读");
  await expect(page.getByRole("button", { name: "分享", exact: true })).toBeVisible();
  const prose = page.locator(".blog-article-reading-layout > .prose");
  await expect(prose.locator("p")).toHaveCount(2);
  await expect(prose).toContainText("让表达更真诚，让靠近更有分寸");
  const cover = page.locator(".project-article-cover img");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveCSS("object-fit", "contain");
  await expect.poll(() => cover.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const aspectError = () => cover.evaluate(element => {
    const image = element as HTMLImageElement;
    const box = image.getBoundingClientRect();
    return Math.abs(box.width / box.height - image.naturalWidth / image.naturalHeight);
  });
  await expect.poll(aspectError).toBeLessThan(.02);
  await expect(page.getByRole("complementary", { name: "文章导航" })).toBeAttached();
  // This short project has no Markdown section headings: no empty TOC is rendered.
  await expect(page.locator('nav[aria-label="本文目录"]')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(aspectError).toBeLessThan(.02);
  await expect(prose).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("link", { name: "← 返回项目目录" })).toHaveAttribute("href", "/projects");
  const projectNavigation = page.getByRole("navigation", { name: "项目导航" });
  await expect(projectNavigation.getByRole("link").first()).toHaveAttribute("href", /^\/projects\//);
});

test("mobile About notes preserve the owner's words and support keyboard expansion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "哈喽！我是 Wesley。" })).toBeVisible();
  const movies = page.getByRole("button", { name: /电影、阅读/ });
  await movies.click();
  await expect(movies).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#about-note-1")).toContainText("精灵宝钻资深学者（没那么权威）");
  const everyday = page.getByRole("button", { name: /也留一点时间/ });
  await everyday.focus();
  await page.keyboard.press("Enter");
  await expect(everyday).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#about-note-1")).toHaveAttribute("inert", "");
  await expect(page.locator("#about-note-2")).toContainText("MBTI 是 ENFP");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
