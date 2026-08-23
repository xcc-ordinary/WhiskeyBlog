import { expect, test } from "@playwright/test";

test("home presents the exhibition chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "精选项目" })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore selected work/i })).toHaveAttribute("href", "/projects");
});

test("public exhibition marks visual camera layers without changing reading landmarks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("parallax-layer").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByRole("region", { name: "生活影像档案" })).toBeVisible();
});

test("about and blog keep field-notes landmarks and external handoff honest", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "关于我，仍在远航。" })).toBeVisible();
  await expect(page.getByRole("link", { name: "小红书" })).toHaveAttribute("href", /^https:\/\//);
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "把过程，写成证据。" })).toBeVisible();
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

test("mobile archive panorama uses a bounded cover crop instead of stretching", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const gallery = page.getByRole("region", { name: "横向滚动摄影画廊" });
  const panorama = gallery.locator('[aria-hidden="true"]').first();
  await expect(gallery).toBeVisible();
  await expect(panorama).toHaveCSS("background-size", "cover");
  await expect(panorama).toHaveCSS("width", "390px");
  await expect.poll(() => panorama.evaluate((element) => getComputedStyle(element).maskImage)).not.toBe("none");
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
  await expect(page.getByRole("heading", { name: /语言的边界/i })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(hydrationErrors).toEqual([]);
});

test("desktop enables camera glide while reduced motion stays native", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect.poll(() => page.locator("html").getAttribute("data-smooth-scroll")).toBe("enabled");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");
});

test("published Studio images enter the asymmetric homepage gallery", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const gallery = page.getByRole("region", { name: "横向滚动摄影画廊" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator(".horizontal-gallery-piece")).toHaveCount(4);
  await expect(gallery.getByRole("img", { name: "柔和晨光下的山谷" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect(gallery.getByText("PRIVATE OBSERVATIONS")).toBeVisible();
});

test("a public hash target remains reachable with cinematic scroll enabled", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "enabled");
  await page.evaluate(() => {
    window.location.hash = "selected-work";
  });
  await expect(page.locator("#selected-work")).toBeInViewport();
  await page.goBack();
  await page.goForward();
  await expect(page.locator("#selected-work")).toBeInViewport();
});

test("a wide coarse-pointer device keeps Lenis and continuous parallax disabled", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query !== "(pointer: coarse)") return nativeMatchMedia(query);
      return {
        addEventListener: () => undefined,
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: true,
        media: query,
        onchange: null,
        removeEventListener: () => undefined,
        removeListener: () => undefined,
      };
    };
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");

  const firstLayer = page.getByTestId("parallax-layer").first();
  await expect(firstLayer).toBeVisible();
  await expect(firstLayer).not.toHaveClass(/parallax-layer-motion/);
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => firstLayer.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("parallax layers stay static on mobile and with reduced motion", async ({ page }) => {
  const firstLayer = page.getByTestId("parallax-layer").first();
  const computedTransform = () => firstLayer.evaluate((element) => getComputedStyle(element).transform);
  const advanceFrames = () => page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(firstLayer).toBeVisible();
  await expect.poll(computedTransform).toBe("none");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await advanceFrames();
  await expect.poll(computedTransform).toBe("none");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(firstLayer).toBeVisible();
  await expect.poll(computedTransform).toBe("none");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await advanceFrames();
  await expect.poll(computedTransform).toBe("none");
});
