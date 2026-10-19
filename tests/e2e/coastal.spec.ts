import { expect, test } from "@playwright/test";

test("coastal home preserves language, reply choices, project routes and archive data", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".edition-editorial-cover")).toBeVisible();
  await expect(page.locator("#home-title")).toContainText("WHISKEY");
  const live = page.getByRole("article", { name: "Lumi 交互样例" });
  await live.getByRole("button", { name: "稳重关心" }).click();
  await expect(live.locator(".home-reply-result")).toContainText("辛苦了，好好休息");
  await page.locator('[data-room-trigger="lumi"]').first().click();
  const replies = page.getByRole("group", { name: "选择回复语气" });
  await expect(replies.getByRole("button", { name: "稳重关心" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog").locator(".home-reply-result")).toContainText("辛苦了，好好休息");
  await replies.getByRole("button", { name: "尊重边界" }).click();
  await expect(page.locator('.home-project-1 .home-project-read')).toHaveAttribute("href", "/projects/lumi");
  await page.getByRole("button", { name: "关闭预览", exact: true }).click();
  await expect(live.getByRole("button", { name: "尊重边界" })).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-room-trigger="dreambook"]').first().click();
  await expect(page.locator('.home-project-0 .home-project-read')).toHaveAttribute("href", "/projects/dreambook-realm");
  await page.getByRole("button", { name: "关闭预览", exact: true }).click();
  await page.locator('[data-room-trigger="life"]').last().click();
  await expect(page.locator(".home-life .home-photo")).toHaveCount(2);
  await page.getByRole("button", { name: "关闭预览", exact: true }).click();
  await page.locator(".editorial-header-actions .language-toggle").click();
  await page.locator('[data-room-trigger="lumi"]').first().click();
  await expect(page.getByRole("group", { name: "Choose a reply tone" })).toBeVisible();
  await expect(page.locator(".home-project-read").first()).toContainText("Read the story");
});

test("featured works can be dragged without accidentally opening a project", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const strip = page.locator(".edition-strip");
  const box = await strip.boundingBox();
  await page.mouse.move(box!.x + box!.width * .8, box!.y + 65);
  await page.mouse.down();
  await page.mouse.move(box!.x + 120, box!.y + 65, { steps: 15 });
  await page.mouse.up();
  await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
  await expect(page.locator(".portal-dialog")).not.toBeVisible();
});

test("mobile directory restores focus and navigates to existing pages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "导航 +" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "导航菜单" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "项目", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ALL WORK!");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("blog categories still filter content and the project page remains linked", async ({ page }) => {
  await page.goto("/blog");
  const all = await page.locator(".notes-directory>li").count();
  await page.getByRole("toolbar", { name: "按分类筛选文章" }).getByRole("button", { name: "Codex", exact: true }).click();
  await expect(page.locator(".notes-directory>li")).toHaveCount(1);
  await expect(page.locator(".notes-directory")).toContainText("Codex 安装与使用教程");
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await expect(page.locator(".notes-directory>li")).toHaveCount(all);
  await page.goto("/projects");
  await page.getByRole("button", { name: /Lumi/ }).click();
  await page.locator('a[href="/projects/lumi"]').filter({ has: page.locator("h2") }).click();
  await expect(page).toHaveURL(/\/projects\/lumi$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Lumi", level: 1, exact: true })).toBeVisible();
  await expect(page.locator(".blog-article-reading-layout > .prose")).toContainText("让表达更真诚，让靠近更有分寸");
  await expect(page.locator(".project-article-cover img")).toHaveCSS("object-fit", "contain");
  await expect(page.locator(".blog-article-meta")).toContainText("分钟阅读");
});

test("reduced motion and private Studio retain their original behavior", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll");
  await expect(page.locator("#home-title")).toBeVisible();
  await page.goto("/studio/login");
  await expect(page.locator(".coastal-site")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "发送魔法登录链接" })).toBeVisible();
});
