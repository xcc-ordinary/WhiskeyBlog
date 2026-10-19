import { expect, test, type Page } from "@playwright/test";

async function openCards(page: Page) {
  await page.goto("/");
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "跳过入场" }).click();
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-intro", "complete");
  await page.locator(".edition-note-cards").scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
}

test("four cards retain fixed layers and reproduce source hover and return positions", async ({ page }) => {
  await openCards(page);
  const rail = page.locator(".edition-note-cards");
  const cards = rail.locator(":scope>a");
  await expect(cards).toHaveCount(4);
  async function positions() {
    return rail.evaluate(element => {
      const box = element.getBoundingClientRect();
      return Array.from(element.children, child => (child.getBoundingClientRect().left - box.left) / box.width * 96);
    });
  }
  async function settles(target: number[]) {
    await expect.poll(async () => (await positions()).every((x, i) => Math.abs(x - target[i]) < .15), { timeout: 3000 }).toBe(true);
  }
  await settles([0, 18, 37, 55]);
  for (const card of await cards.all()) await expect(card).toHaveCSS("background-color", "rgb(244, 241, 233)");
  await cards.nth(0).hover({ position: { x: 25, y: 65 } });
  await expect(rail).toHaveAttribute("data-card-state", "1");
  await settles([0, 39, 55, 70]);
  await expect(cards.nth(0)).toHaveCSS("background-color", "rgb(234, 231, 222)");
  expect(await cards.evaluateAll(elements => elements.map(e => getComputedStyle(e).zIndex))).toEqual(["auto", "auto", "auto", "auto"]);
  await page.mouse.move(5, 5);
  await settles([0, 18, 37, 55]);
  await expect(cards.nth(0)).toHaveCSS("background-color", "rgb(244, 241, 233)");
  // Use the exposed portion; locator auto-scrolling can move a clipped paper rail.
  const third = await cards.nth(2).boundingBox();
  await page.mouse.move(third!.x + 25, third!.y + 65);
  await expect(rail).toHaveAttribute("data-card-state", "3");
  await settles([0, 18, 37, 75]);
  await page.mouse.move(5, 5);
  await cards.nth(0).focus();
  await expect(rail).toHaveAttribute("data-card-state", "1");
  await settles([0, 39, 55, 70]);
  await expect(cards.nth(0)).toBeFocused();
  await expect(cards.nth(3)).toHaveAttribute("href", "/about");
});

test("public scrollbar is hidden while wheel, touch layout and private pages remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).toBe("none");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement, "::-webkit-scrollbar").display)).toBe("none");
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.setViewportSize({ width: 390, height: 844 });
  const cards = page.locator(".edition-note-cards>a");
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator("video")).toHaveCount(0);
  await page.goto("/studio/login");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).not.toBe("none");
});

test("second English card stays anchored and exposes its text for pointer and keyboard", async ({ page }) => {
  await openCards(page);
  await page.locator(".editorial-header-actions .language-toggle").click();
  const rail = page.locator(".edition-note-cards");
  const cards = rail.locator(":scope>a");
  await rail.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  const second = cards.nth(1);
  const rest = await second.boundingBox();
  await page.mouse.move(rest!.x + 25, rest!.y + 65);
  await expect(rail).toHaveAttribute("data-card-state", "2");
  const isOpen = () => rail.evaluate(element => {
    const box = element.getBoundingClientRect();
    const x = Array.from(element.children, child => (child.getBoundingClientRect().left - box.left) / box.width * 96);
    return x.every((value, index) => Math.abs(value - [0, 18, 57, 72][index]) < .15);
  });
  await expect.poll(isOpen, { timeout: 3000 }).toBe(true);
  expect(Math.abs((await second.boundingBox())!.x - rest!.x)).toBeLessThan(1);
  expect(await second.evaluate(card => {
    const text = card.querySelector("p")!.getBoundingClientRect();
    return document.elementFromPoint(text.right - 2, text.top + 12)?.closest("a") === card;
  })).toBe(true);
  await page.mouse.move(5, 5);
  await second.focus();
  await expect(second).toBeFocused();
  await expect.poll(isOpen, { timeout: 3000 }).toBe(true);
  await expect(second).toHaveAttribute("href", "/projects");
});
