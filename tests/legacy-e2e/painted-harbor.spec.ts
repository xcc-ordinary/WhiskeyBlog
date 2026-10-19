import { expect, test } from "@playwright/test";

const harbor = (page: import("@playwright/test").Page) => page.locator('.home-harbor');

test("Blender harbor loads real geometry, responds to viewpoints and pauses GPU frames", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const model = page.waitForResponse((response) => response.url().endsWith("/models/home-harbor/harbor.glb"));
  await page.goto("/");
  await page.getByRole("button", { name: "探索互动港口" }).click();
  expect((await model).ok()).toBe(true);
  const scene = harbor(page);
  await expect(scene).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
  const surface = scene.locator(".home-harbor-stage");
  await expect(surface).toHaveAttribute("data-model", "blender-volumetric");
  await expect.poll(async () => Number(await surface.getAttribute("data-triangles"))).toBeGreaterThan(100_000);
  await expect.poll(async () => Number(await surface.getAttribute("data-draw-calls"))).toBeGreaterThan(5);
  await page.mouse.move(1100, 550);
  await expect.poll(async () => Number((await surface.getAttribute("data-view"))?.split(",")[0]), { timeout: 20_000 }).toBeGreaterThan(.1);
  await scene.getByRole("button", { name: "视角归中", exact: true }).click();
  await expect.poll(async () => Math.abs(Number((await surface.getAttribute("data-view"))?.split(",")[0])), { timeout: 20_000 }).toBeLessThan(.05);
  await scene.getByRole("button", { name: "暂停场景", exact: true }).click();
  await expect(scene).toHaveAttribute("data-paused", "true");
  const frames = await surface.getAttribute("data-frames");
  await page.waitForTimeout(350);
  expect(await surface.getAttribute("data-frames")).toBe(frames);
  await scene.getByRole("button", { name: "继续场景", exact: true }).click();
  await expect.poll(async () => Number(await surface.getAttribute("data-frames"))).toBeGreaterThan(Number(frames));
  await page.getByRole("link", { name: "探索精选作品", exact: true }).click();
  await expect(page).toHaveURL(/#selected-work$/);
  expect(errors).toEqual([]);
});

test("reduced motion uses the poster without downloading a model", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const models: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith(".glb")) models.push(request.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: "探索互动港口" }).click();
  await expect(harbor(page)).toHaveAttribute("data-state", "static");
  await expect(harbor(page)).toHaveCSS("background-image", /poster/);
  await expect(harbor(page).locator("canvas")).toHaveCount(0);
  expect(models).toEqual([]);
});

test("model download failure keeps a readable homepage and working project link", async ({ page }) => {
  await page.route("**/models/home-harbor/harbor.glb", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "探索互动港口" }).click();
  await expect(harbor(page)).toHaveAttribute("data-state", "fallback", { timeout: 30_000 });
  await expect(harbor(page)).toHaveCSS("background-image", /poster/);
  await expect(harbor(page).locator("canvas")).toHaveCount(0);
  await expect(page.locator("#home-title")).toBeVisible();
  await page.getByRole("link", { name: "探索精选作品", exact: true }).click();
  await expect(page).toHaveURL(/#selected-work$/);
});

test.describe("portrait harbor", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("portrait crop keeps the heading, real geometry and native scrolling", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await page.getByRole("button", { name: "探索互动港口" }).click();
    await expect(harbor(page)).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await expect(page.locator("#home-title")).toBeVisible();
    await page.touchscreen.tap(270, 580);
    await page.screenshot({ path: "design/harbor/website-mobile.png" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await page.getByRole("button", { name: "导航 +" }).click();
    await expect(page.getByRole("dialog", { name: "导航菜单" })).toBeVisible();
  });
});
