import { expect, test } from "@playwright/test";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

test("a project click carries its artwork on a torn paper sheet and releases the destination", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
  const skip = page.getByRole("button", { name: "跳过入场" });
  if (await skip.isVisible()) await skip.click();
  await page.locator(".edition-teaser-listenband").click();
  const curtain = page.locator(".journal-page-transition");
  await expect(curtain).toHaveAttribute("data-state", "covering");
  await expect(curtain.locator("img")).toHaveAttribute("src", /listenband-editorial/);
  await expect(curtain.locator("svg path")).toHaveAttribute("d", /^M.*L/);
  await expect(page).toHaveURL(/\/projects\/listenband$/, { timeout: 15_000 });
  await expect(curtain).toHaveAttribute("data-state", "idle");
  await expect(curtain).toHaveCSS("visibility", "hidden");
  await expect(page.locator("html")).not.toHaveAttribute("data-page-transition");
  await expect(page.locator(".project-article #article-title")).toHaveText("ListenBand");
  await expect(page.locator(".blog-article-reading-layout>.prose")).toContainText("Obsidian");
  expect(errors).toEqual([]);
});

test("reduced motion and keyboard navigation bypass the paper sheet", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".edition-teaser-listenband").click();
  await expect(page).toHaveURL(/\/projects\/listenband$/);
  await expect(page.locator(".journal-page-transition")).toHaveAttribute("data-state", "idle");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("link", { name: "返回项目目录" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator(".journal-page-transition")).toHaveAttribute("data-state", "idle");
});

test("a failed artwork request still completes the transition and leaves links usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".coastal-edition")).toHaveAttribute("data-hydrated", "true");
  const skip = page.getByRole("button", { name: "跳过入场" });
  if (await skip.isVisible()) await skip.click();
  const card = page.locator(".edition-teaser-listenband");
  await card.locator("img").evaluate(image => { image.removeAttribute("srcset"); image.setAttribute("src", "/missing-transition-artwork.png"); });
  await card.click();
  await expect(page.locator(".journal-transition-label")).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/listenband$/, { timeout: 15_000 });
  await expect(page.locator(".journal-page-transition")).toHaveAttribute("data-state", "idle");
  await expect(page.locator(".journal-page-transition")).toHaveCSS("pointer-events", "none");
});

test("a newly saved MDX project enters home, directory and the same article renderer automatically", async ({ page, baseURL }) => {
  test.skip(!baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Local content fixture only");
  const slug = `journal-sync-${crypto.randomUUID()}`;
  const file = path.join(process.cwd(), "content", "projects", `${slug}.mdx`);
  try {
    await writeFile(file, `---\ntitle: "自动同步验证"\ndescription: "保存一次，所有入口读取同一份内容。"\ndate: "2026-10-18"\ntags: ["验证"]\nslug: "${slug}"\ncoverFit: contain\n---\n\n## 项目过程\n\n正文含有 **粗体** 和 [项目链接](https://github.com/xcc-ordinary/ListenBand)。\n\n![封面回退](/images/projects/listenband-editorial-cream-navy-v1.png)\n\n- 第一项\n- 第二项\n`, { flag: "wx" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const teaser = page.locator(`.edition-work-teaser[href="/projects/${slug}"]`);
    await expect(teaser).toContainText("自动同步验证");
    await expect(teaser.locator("img")).toHaveCSS("object-fit", "contain");
    await page.goto("/projects");
    await expect(page.getByRole("button", { name: /自动同步验证/ })).toBeVisible();
    await page.goto(`/projects/${slug}`);
    await expect(page.locator("#article-title")).toHaveText("自动同步验证");
    const prose = page.locator(".blog-article-reading-layout>.prose");
    await expect(prose.locator("h2")).toContainText("项目过程");
    await expect(prose.locator("strong")).toHaveText("粗体");
    await expect(prose.locator("ul>li")).toHaveCount(2);
    await expect(prose.getByRole("link", { name: "项目链接" })).toHaveAttribute("href", "https://github.com/xcc-ordinary/ListenBand");
    // Body-derived covers remain in listing cards and render only once in the article.
    await expect(page.locator(".project-article-cover img")).toHaveCount(0);
    await expect(prose.locator("img")).toHaveCount(1);
    await expect(prose.locator("img")).toHaveCSS("object-fit", "contain");
    const headingId = await prose.locator("h2").getAttribute("id");
    expect(headingId).toBeTruthy();
    await expect(page.locator('nav[aria-label="本文目录"] a').first()).toHaveAttribute("href", `#${headingId}`);
  } finally { await unlink(file).catch(() => {}); }
});
