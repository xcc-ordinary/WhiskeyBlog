import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, reducedMotion: "reduce" | "no-preference" = "no-preference") {
  await page.emulateMedia({ reducedMotion });
  await page.goto("/");
  const skip = page.locator(".edition-skip");
  if (reducedMotion === "no-preference") {
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(skip).toHaveCount(0);
  }
  const spread = page.locator(".edition-newspaper");
  await spread.scrollIntoViewIfNeeded();
  return spread;
}

test("paper turns settle on the latest requested edition without changing frame geometry", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const spread = await open(page);
  const frames = spread.locator('.edition-work-teaser[data-active=true] .edition-teaser-image');
  const before = await frames.first().boundingBox();
  await spread.evaluate(element => {
    const phases: string[] = [];
    element.setAttribute("data-observed-phases", "");
    new MutationObserver(() => {
      const phase = element.getAttribute("data-phase")!;
      if (phases.at(-1) !== phase) phases.push(phase);
      element.setAttribute("data-observed-phases", phases.join(","));
    }).observe(element, { attributes: true, attributeFilter: ["data-phase"] });
  });
  const numbers = spread.locator("[data-issue]");
  await numbers.nth(1).click();
  await expect(spread).toHaveAttribute("data-phase", /preparing|covering|covered|revealing/);
  await numbers.last().click();
  await expect(numbers.last()).toHaveAttribute("aria-current", "page");
  await expect(spread).toHaveAttribute("data-phase", "idle");
  await expect(spread).toHaveAttribute("data-observed-phases", /covering.*covered.*revealing.*idle/);
  await expect(spread.getByRole("status")).toContainText(`${await numbers.count()} /`);
  await expect(frames).toHaveCount(2);
  const after = await frames.first().boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 1);
  expect(after!.height).toBeCloseTo(before!.height, 1);
  await numbers.first().click();
  await expect(spread).toHaveAttribute("data-direction", "previous");
  await expect(spread).toHaveAttribute("data-phase", "revealing");
  await numbers.nth(1).click();
  await expect(spread).toHaveAttribute("data-phase", "idle");
  await expect(spread.getByRole("status")).toContainText("2 /");
  expect(errors).toEqual([]);
});

test("keyboard and changing motion preference complete a turn immediately", async ({ page }) => {
  const spread = await open(page);
  const numbers = spread.locator("[data-issue]");
  await numbers.first().focus();
  await page.keyboard.press("End");
  await expect(numbers.last()).toBeFocused();
  await expect(spread).toHaveAttribute("data-phase", "idle");
  await expect(spread).toHaveAttribute("data-instant", "true");
  await page.keyboard.press("Home");
  await expect(numbers.first()).toBeFocused();
  await numbers.nth(1).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(spread).toHaveAttribute("data-phase", "idle");
  await expect(spread.getByRole("status")).toContainText("2 /");
  await expect(spread.locator(".edition-spread-paper").first()).toBeHidden();
});

for (const width of [320, 390, 1280]) {
  test(`edition frames and controls fit ${width}px in both languages`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const spread = await open(page, "reduce");
    for (let language = 0; language < 2; language++) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const boxes = await spread.locator('.edition-work-teaser[data-active=true] .edition-teaser-image').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
      expect(boxes[0].width).toBeCloseTo(boxes[1].width, 1);
      for (const box of boxes) expect(box.width / box.height).toBeCloseTo(1.5, 2);
      for (const button of await spread.locator("button").all()) {
        const box = (await button.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      if (language === 0) await page.locator(".editorial-header-actions .language-toggle").click();
    }
  });
}

test("unavailable covers retain an accessible paper frame and working project link", async ({ page }) => {
  await page.route("**/_next/image?*", route => route.abort());
  const spread = await open(page, "reduce");
  const first = spread.locator('.edition-work-teaser[data-active=true]').first();
  await expect(first.locator(".edition-cover-unavailable")).toBeVisible();
  await expect(first).toHaveAttribute("href", /\/projects\//);
  const href = await first.getAttribute("href");
  await first.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});
