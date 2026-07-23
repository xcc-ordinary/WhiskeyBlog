import { expect, test } from "@playwright/test";
test("visits home, a project, and a post", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把每一次实践，变成下一次成长。" })).toBeVisible();
  await page.getByRole("link", { name: "项目" }).first().click();
  await page.getByRole("link", { name: "WhiskeyBlog" }).first().click();
  await expect(page.getByRole("heading", { name: "WhiskeyBlog" })).toBeVisible();
  await page.goto("/blog/building-this-site");
  await expect(page.getByRole("heading", { name: "从零搭建 WhiskeyBlog" })).toBeVisible();
});
