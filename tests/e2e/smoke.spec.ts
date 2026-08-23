import { expect, test } from "@playwright/test";

test("publishes crawl metadata and baseline security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["strict-transport-security"]).toBe("max-age=31536000");

  await page.goto("/sitemap.xml");
  const sitemap = await page.locator("body").innerText();
  expect(sitemap).toContain("/archive");
  expect(sitemap).not.toContain("/studio");
});

test("visits home, a project, and a post", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await page.goto("/projects/whiskey-blog");
  await expect(page.getByRole("heading", { level: 1, name: "WhiskeyBlog", exact: true })).toBeVisible();
  await page.goto("/blog/building-this-site");
  await expect(page.getByRole("heading", { level: 1, name: "从零搭建 WhiskeyBlog", exact: true })).toBeVisible();
  await expect(page).toHaveTitle("从零搭建 WhiskeyBlog | WhiskeyBlog");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/blog\/building-this-site$/);
});
