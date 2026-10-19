import { expect, test } from "@playwright/test";

test("home presents the personal journal and saved project covers", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#home-title")).toHaveText("WHISKEY");
  await expect(page.locator(".edition-editorial-cover")).toContainText("IDEAS.");
  await expect(page.locator('.edition-teaser-dreambook img')).toHaveAttribute("src", /realm-watercolor-cream-blue-v1/);
  await expect(page.locator('.edition-teaser-dreambook img')).toHaveCSS("object-position", "50% 50%");
  await expect(page.locator('.edition-editorial-cover a')).toHaveAttribute("href", "/projects");
});

test("about, notes and archive retain their public landmarks", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "关于我，仍在远航。" })).toBeVisible();
  await expect(page.getByRole("link", { name: "小红书" })).toHaveAttribute("href", /^https:\/\//);
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "把过程，写成证据。" })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByRole("region", { name: "生活影像档案" })).toBeVisible();
});

test("life preview reads published archive images and returns focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "打开生活档案", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".home-photo")).toHaveCount(2);
  await expect(dialog.getByRole("img", { name: "柔和晨光下的山谷" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("reduced motion homepage hydrates without errors or horizontal overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("desktop glide respects reduced motion and public hash navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "enabled");
  const skip = page.getByRole("button", { name: "跳过入场" });
  if (await skip.isVisible()) await skip.click();
  await page.evaluate(() => { window.location.hash = "selected-work"; });
  await expect(page.locator("#selected-work")).toBeInViewport();
  await page.goBack();
  await page.goForward();
  await expect(page.locator("#selected-work")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");
});

test("a wide coarse-pointer device leaves document scrolling native", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      const result = nativeMatchMedia(query);
      if (query === "(pointer: coarse)") Object.defineProperty(result, "matches", { value: true });
      return result;
    };
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
  const skip = page.getByRole("button", { name: "跳过入场" });
  if (await skip.isVisible()) await skip.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");
  await page.evaluate(() => window.scrollTo(0, 240));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(120);
});

test("featured artwork leads to the saved project case page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".edition-teaser-dreambook").click();
  await expect(page).toHaveURL(/\/projects\/dreambook-realm$/);
  await expect(page.getByRole("heading", { level: 1, name: "藏梦书境" })).toBeVisible();
  await expect(page.locator(".blog-article-reading-layout > .prose")).toContainText("一个把难以言说的情绪收进书页的阅读陪伴项目");
  await expect(page.locator(".project-article-cover img")).toHaveCSS("object-fit", "contain");
});
