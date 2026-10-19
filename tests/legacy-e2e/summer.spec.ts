import { expect, test } from "@playwright/test";

test.describe("summer coast", () => {
  test.setTimeout(60_000);
  test("homepage preserves original artwork and never requests video", async ({ page }) => {
    const videoRequests: string[] = [];
    page.on("request", request => {if (/\.(mp4|webm)(\?|$)/.test(request.url())) videoRequests.push(request.url());});
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const image = page.locator(".coastal-artwork img");
    await expect(image).toHaveAttribute("src", "/images/coastal/summer-terrace-v1.webp");
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1536);
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /播放短片|暂停短片|Play film|Pause film/ })).toHaveCount(0);
    expect(videoRequests).toEqual([]);
    await expect(page.locator("#home-title")).toHaveCSS("background-color", "rgb(23, 62, 85)");
  });

  test("mobile and English layout fit the screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
    if (!await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      await page.getByRole("button", { name: /跳过入场|Skip intro/ }).click();
      await expect(page.locator(".coastal-edition")).toHaveAttribute("data-intro", "complete");
    }
    await expect(page.locator("#home-title")).toBeVisible();
    await page.locator(".editorial-header-actions .language-toggle").click();
    await expect(page.locator(".edition-dropcap")).toContainText("AI student");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole("button", { name: "Index +", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("emotional doors preserve the project's characters and support keyboard input", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
    if (!await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      await page.getByRole("button", { name: /跳过入场|Skip intro/ }).click();
      await expect(page.locator(".coastal-edition")).toHaveAttribute("data-intro", "complete");
    }
    await page.locator('[data-room-trigger="dreambook"]').first().click();
    const choices = page.getByRole("group", { name: "选择情绪之门" });
    await choices.getByRole("button", { name: "喜悦", exact: true }).click();
    await expect(page.locator(".dreambook-door-name")).toHaveText("铃芽");
    await expect(page.locator(".dreambook-line")).toContainText("微小的开心");
    const anxiety = choices.getByRole("button", { name: "焦虑", exact: true });
    await anxiety.focus();
    await page.keyboard.press("Enter");
    await expect(anxiety).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".dreambook-door-name")).toHaveText("息摆");
    await expect(page.locator(".home-project-0 .home-project-read")).toHaveAttribute("href", "/projects/dreambook-realm");
  });

  test("project curtain traps focus, closes on Escape and restores the entry button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
    if (!await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      await page.getByRole("button", { name: /跳过入场|Skip intro/ }).click();
      await expect(page.locator(".coastal-edition")).toHaveAttribute("data-intro", "complete");
    }
    const trigger = page.locator('[data-room-trigger="lumi"]').first();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Lumi" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "关闭预览", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("normal motion uses the page curtain and completes navigation without locking input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "跳过入场" }).click();
    await page.locator(".edition-portrait").click();
    await expect(page.locator(".journal-page-transition .journal-transition-sheet")).toHaveCount(1);
    await expect(page).toHaveURL(/\/about$/, { timeout: 15_000 });
    await expect(page.locator(".journal-page-transition")).toHaveCSS("visibility", "hidden", { timeout: 5_000 });
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });
});
