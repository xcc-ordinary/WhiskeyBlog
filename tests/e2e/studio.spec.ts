import { expect, test } from "@playwright/test";
test("unauthenticated Studio access reaches the sign-in page without cinematic scrolling", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/login$/);
  await expect(page.getByRole("heading", { name: "进入 Media Studio。" })).toBeVisible();
  await expect(page.getByRole("button", { name: "发送魔法登录链接" })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll");
});
