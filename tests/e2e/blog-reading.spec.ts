import { expect, test } from "@playwright/test";

test("blog index exposes its article directory without waiting for a reveal", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "文章与札记" })).toBeAttached();
  await page.getByRole("heading", { name: "文章与札记" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: /阅读文章：Codex 安装与使用教程/ })).toBeVisible();
});

test("article provides readable metadata, table of contents, progress, and a next note", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/blog/codex-guide");

  await expect(page.getByRole("heading", { name: "Codex 安装与使用教程" })).toBeVisible();
  await expect(page.getByText(/分钟阅读/).first()).toBeVisible();
  const tocLink = page.getByRole("navigation", { name: "本文目录" }).getByRole("link", { name: "2. 安装 Codex" });
  await tocLink.click();
  await expect.poll(() => page.evaluate(() => decodeURIComponent(window.location.hash))).toBe("#2-安装-codex");
  await expect(page.getByRole("heading", { name: /2. 安装 Codex/ })).toBeInViewport();
  await expect(page.getByRole("link", { name: /继续阅读/ })).toBeVisible();
});

test("mobile article keeps controls and prose within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/codex-guide");

  const toc = page.locator(".article-mobile-toc");
  await expect(toc).toBeVisible();
  await toc.locator("summary").click();
  await expect(toc.getByRole("link", { name: "2. 安装 Codex" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
