import { expect, test } from "@playwright/test";

test("shared visual language remains readable across public routes and mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/about", "/projects", "/projects/lumi", "/archive", "/blog", "/blog/building-this-site", "/studio/login"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${width}px`).toBeLessThanOrEqual(width);
      const shell = page.locator(path.startsWith("/studio") ? ".studio-admin" : ".coastal-site");
      await expect(shell).toHaveCSS("background-color", "rgb(244, 241, 233)");
      await expect(shell.locator('img[src*="summer-terrace"],img[src*="ocean-steps"],img[src*="sunlit-passage"],.coastal-scene-switch')).toHaveCount(0);
      if (path === "/blog/building-this-site") {
        await expect(page.locator(".blog-article-reading-layout>.prose")).toHaveCSS("font-size", width > 760 ? "18px" : "17px");
        await expect(page.locator(".blog-article-reading-layout>.prose")).toHaveCSS("line-height", width > 760 ? "33.3px" : "31.45px");
      }
      if (path === "/blog") {
        const filter = page.locator(".notes-filter button").first();
        await expect(filter).toHaveCSS("border-radius", "6px");
        await expect(filter).toHaveCSS("min-height", "44px");
        await expect(filter).toHaveCSS("backdrop-filter", "none");
        await expect(filter).toHaveCSS("background-color", "rgb(36, 55, 67)");
      }
      if (path === "/studio/login") {
        const submit = page.locator(".studio-button").first();
        await expect(submit).toHaveCSS("font-size", "14px");
        await expect(submit).toHaveCSS("min-height", "44px");
        await expect(submit).toHaveCSS("border-radius", "6px");
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).not.toBe("none");
      }
      if (width !== 320) {
        await page.screenshot({ path: `design/visual-language-2026-10-17/applied-${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}-${width}.png`, fullPage: false });
      }
    }
  }
  expect(failures).toEqual([]);
});

test("language switch selects English display and reading roles while retaining the personal journal cover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".editorial-header-actions .language-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".edition-cover-profile h2")).toContainText("CURIOUS");
  await expect(page.locator(".edition-cover-profile h2")).toHaveCSS("line-height", /px$/);
  const display = await page.locator(".edition-cover-profile h2").evaluate(element => getComputedStyle(element).fontFamily);
  expect(display.toLowerCase()).toContain("bodoni");
  const reading = await page.locator(".edition-dropcap").evaluate(element => getComputedStyle(element).fontFamily);
  expect(reading.toLowerCase()).toContain("lora");
  await expect(page.locator(".edition-editorial-cover")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await page.locator(".editorial-header-actions .language-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".edition-dropcap")).toHaveCSS("line-height", "33.3px");
});
