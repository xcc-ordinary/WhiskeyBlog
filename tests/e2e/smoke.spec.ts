import { expect, test } from "@playwright/test";
test("visits home, a project, and a post", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /growing with every build/i })).toBeVisible();
  await page.goto("/projects/whiskey-blog");
  await expect(page.locator("main > article > header").getByRole("heading", { name: "WhiskeyBlog", exact: true })).toBeVisible();
  await page.goto("/blog/building-this-site");
  await expect(page.locator("main > article > header h1")).toHaveText("从零搭建 WhiskeyBlog");
});
