import { expect, test } from "@playwright/test";

test("home presents the exhibition chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /growing/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Selected work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore selected work/i })).toHaveAttribute("href", "/projects");
});
