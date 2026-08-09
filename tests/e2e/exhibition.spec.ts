import { expect, test } from "@playwright/test";

test("home presents the exhibition chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /growing/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Selected work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore selected work/i })).toHaveAttribute("href", "/projects");
});

test("about and blog keep field-notes landmarks and external handoff honest", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /still learning/i })).toBeVisible();
  await page.goto("/blog");
  await expect(page.getByRole("link", { name: /follow on 小红书/i })).toHaveAttribute("href", /^https:\/\//);
});

test("mobile navigation remains usable and exhibition motion respects reduction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /index/i });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "导航菜单" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("reduced motion homepage hydrates without a recoverable error", async ({ page }) => {
  const hydrationErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|server rendered text/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /growing/i })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(hydrationErrors).toEqual([]);
});
