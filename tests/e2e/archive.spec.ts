import { expect, test } from "@playwright/test";

test("Archive shows published media and never renders draft metadata", async ({ page }) => {
  await page.goto("/archive");

  await expect(page.getByRole("heading", { name: "Life Archive" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Life archive" })).toBeVisible();
  await expect(page.getByRole("img", { name: "薄雾覆盖的绿色山谷" })).toBeVisible();
  await expect(page.getByText("雾中的山谷")).toBeVisible();
  await expect(page.getByText("草稿：不应公开")).toHaveCount(0);
});
