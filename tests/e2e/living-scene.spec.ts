import { expect, test, type Locator, type Page } from "@playwright/test";

const harborScene = (page: Page) => page.locator('.living-scene[data-scene="harbor"]').first();

async function expectReadyScene(page: Page) {
  const scene = harborScene(page);
  await expect(scene).toHaveAttribute("data-state", "ready", { timeout: 20_000 });
  const surface = scene.locator(".living-scene-surface");
  await expect(surface.locator("canvas")).toBeVisible();
  await expect(surface).toHaveAttribute("data-view", /-?\d/);
  return { scene, surface };
}

async function horizontalView(surface: Locator) {
  return Number((await surface.getAttribute("data-view"))?.split(",")[0]);
}

test("the harbor draws a real WebGL scene and follows the visitor's pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const { scene, surface } = await expectReadyScene(page);

  const isDrawing = await surface.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(context && !context.isContextLost() && context.drawingBufferWidth > 0 && context.drawingBufferHeight > 0);
  });
  expect(isDrawing).toBe(true);

  const bounds = await scene.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.18, bounds!.y + bounds!.height * 0.65);
  await expect.poll(() => horizontalView(surface)).toBeLessThan(-0.1);
  await page.mouse.move(bounds!.x + bounds!.width * 0.84, bounds!.y + bounds!.height * 0.65);
  await expect.poll(() => horizontalView(surface)).toBeGreaterThan(0.1);
});

test("scene viewpoint and pause controls are operable with a keyboard", async ({ page }) => {
  await page.goto("/");
  const { scene, surface } = await expectReadyScene(page);

  await scene.getByRole("button", { name: "向左观察", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => horizontalView(surface)).toBeLessThan(-0.1);
  const leftView = await horizontalView(surface);

  await scene.getByRole("button", { name: "向右观察", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => horizontalView(surface)).toBeGreaterThan(leftView + 0.05);

  await scene.getByRole("button", { name: "视角归中", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => Math.abs(await horizontalView(surface))).toBeLessThan(0.05);

  const pause = scene.getByRole("button", { name: "暂停场景", exact: true });
  await expect(surface).toHaveAttribute("data-frames", /\d+/);
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await pause.focus();
  await page.keyboard.press("Space");
  const resume = scene.getByRole("button", { name: "继续场景", exact: true });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.living-scene[data-paused="false"]')).toHaveCount(0);
  await expect(resume).toBeFocused();
  const pausedFrames = await surface.getAttribute("data-frames");
  // Allow multiple potential render frames to pass: pausing must stop GPU work too.
  await page.waitForTimeout(450);
  await expect(surface).toHaveAttribute("data-frames", pausedFrames!);
  await page.keyboard.press("Enter");
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => Number(await surface.getAttribute("data-frames"))).toBeGreaterThan(Number(pausedFrames));
});

test("the animated background leaves the project link and site navigation clickable", async ({ page }) => {
  await page.goto("/");
  await expectReadyScene(page);
  await page.getByRole("link", { name: "探索精选作品" }).click();
  await expect(page).toHaveURL(/#selected-work$/);

  await page.goto("/");
  await expectReadyScene(page);
  await page.getByRole("navigation", { name: "主导航", exact: true }).getByRole("link", { name: "关于我", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "关于我，仍在远航。" })).toBeVisible();
});

test("reduced motion retains the artwork and reading content without a WebGL animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = harborScene(page);
  await expect(scene).toHaveAttribute("data-state", "static");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveCSS("background-image", /home-dieselpunk-harbor-v2\.webp/);
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(scene.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await page.getByRole("link", { name: "探索精选作品" }).click();
  await expect(page).toHaveURL(/#selected-work$/);
});

test("a browser without WebGL keeps the original artwork and working links", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        if (/webgl/i.test(contextId)) return null;
        return Reflect.apply(nativeGetContext, this, [contextId, ...args]);
      },
    });
  });
  await page.goto("/");
  const scene = harborScene(page);
  await expect(scene).toHaveAttribute("data-state", "fallback", { timeout: 20_000 });
  await expect(scene).toBeVisible();
  await expect(scene).toHaveCSS("background-image", /home-dieselpunk-harbor-v2\.webp/);
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(scene.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await page.getByRole("link", { name: "探索精选作品" }).click();
  await expect(page).toHaveURL(/#selected-work$/);
});

test.describe("touch interaction", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("touching the scene preserves native scrolling and the mobile menu", async ({ page }) => {
    await page.goto("/");
    await expectReadyScene(page);
    await page.touchscreen.tap(270, 580);

    // Synthetic CDP scroll gestures do not produce scrolling in headless Chromium
    // (verified against a blank page), so assert the invariants that keep native
    // touch scrolling available instead of a gesture that cannot run anywhere here:
    // the scene never cancels touch input, no CSS traps the scroll, and the document
    // itself still scrolls.
    const sceneLeavesTouchAlone = await page.evaluate(() => {
      const scene = document.querySelector(".living-scene");
      if (!scene) return false;
      const move = new TouchEvent("touchmove", { bubbles: true, cancelable: true });
      scene.dispatchEvent(move);
      return !move.defaultPrevented;
    });
    expect(sceneLeavesTouchAlone).toBe(true);

    const nativeScroll = await page.evaluate(() => {
      const root = document.scrollingElement;
      if (!root) return null;
      const style = getComputedStyle(root);
      window.scrollTo(0, 240);
      const scrolled = window.scrollY;
      window.scrollTo(0, 0);
      return { scrolled, overflow: style.overflow, touchAction: style.touchAction };
    });
    expect(nativeScroll?.scrolled ?? 0).toBeGreaterThan(120);
    expect(nativeScroll?.overflow).not.toContain("hidden");
    expect(nativeScroll?.touchAction).toBe("auto");
    await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");

    const trigger = page.getByRole("button", { name: "导航 +" });
    await trigger.click();
    const menu = page.getByRole("dialog", { name: "导航菜单" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "关于我", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: "关于我，仍在远航。" })).toBeVisible();
  });
});
