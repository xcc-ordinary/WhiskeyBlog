import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const screenshots = "design/studio-journal-v2-2026-10-19";
test.beforeAll(async () => { await mkdir(screenshots, { recursive: true }); });

test("desktop journal, full-size reading proof and explicit publishing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByLabel("即时排版写作区")).toBeVisible();
  await page.getByRole("button", { name: "即时排版", exact: true }).click();
  await expect(page.getByLabel("Markdown", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Markdown", { exact: true })).toHaveCSS("font-size", "17px");
  await expect(page.getByLabel("标题", { exact: true })).toHaveCSS("border-top-width", "0px");
  await page.screenshot({ path: `${screenshots}/desktop-writing.png`, fullPage: true });
  await page.getByRole("button", { name: "对照", exact: true }).click();
  const preview = page.getByLabel("Markdown 实时预览");
  await expect(preview.locator(".markdown-document>p").first()).toHaveCSS("font-size", "18px");
  await expect(preview.locator(".markdown-document>p").first()).toHaveCSS("line-height", "33.3px");
  await expect(preview.getByRole("table")).toBeVisible();
  await expect(preview.locator(".katex")).toBeVisible();
  await expect(preview.locator(".blog-article-header h1")).toHaveText("在日常里，留下自己的观察。");
  await page.screenshot({ path: `${screenshots}/desktop-comparison.png`, fullPage: true });
  await page.getByRole("button", { name: /发布设置/ }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("border-top-left-radius", "14px");
  await page.screenshot({ path: `${screenshots}/desktop-publishing.png` });
  await expect(page.getByRole("button", { name: "更新文章" })).toBeVisible();
  await page.getByRole("button", { name: "更新文章" }).click();
  await expect(page.getByRole("status")).toContainText("文章已更新");
  expect(await page.evaluate(() => (window as unknown as { __studioSubmissions: unknown[] }).__studioSubmissions.length)).toBe(1);
  expect(errors).toEqual([]);
});

test("Markdown import, inline artwork, local recovery and portable export", async ({ page }) => {
  await page.goto("/?mode=new");
  await page.getByLabel("导入 Markdown 文件").setInputFiles({ name: "a-new-note.md", mimeType: "text/markdown", buffer: Buffer.from("# 导入的一页\n\n## 观察\n\n这里是尚未发布的正文。") });
  await expect(page.getByLabel("标题", { exact: true })).toHaveValue("导入的一页");
  await page.getByLabel("上传正文图片").setInputFiles({ name: "process.png", mimeType: "image/png", buffer: Buffer.from("qa fixture") });
  await expect(page.getByLabel("Markdown", { exact: true })).toContainText("whiskey-journal-card.png");
  await page.getByLabel("摘要", { exact: true }).fill("在真实过程中写下的一页。");
  await page.getByLabel("Markdown", { exact: true }).press("ControlOrMeta+s");
  await page.reload();
  await expect(page.getByRole("button", { name: "恢复草稿" })).toBeVisible();
  await page.getByRole("button", { name: "恢复草稿" }).click();
  await expect(page.getByLabel("标题", { exact: true })).toHaveValue("导入的一页");
  await page.getByRole("button", { name: "即时排版", exact: true }).click();
  await expect(page.getByLabel("Markdown", { exact: true })).toContainText("whiskey-journal-card.png");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  expect(await page.evaluate(() => (window as unknown as { __studioSubmissions: unknown[] }).__studioSubmissions.length)).toBe(0);
});

test("mobile supports focus, preview and publication settings without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: `${screenshots}/mobile-writing.png`, fullPage: true });
  await page.getByRole("button", { name: "专注", exact: true }).click();
  await expect(page.locator(".studio-masthead")).toBeHidden();
  await page.screenshot({ path: `${screenshots}/mobile-focus.png`, fullPage: true });
  await page.getByRole("button", { name: "预览", exact: true }).click();
  await expect(page.locator(".markdown-document>p").first()).toHaveCSS("font-size", "17px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshots}/mobile-preview.png`, fullPage: true });
  await page.getByRole("button", { name: /发布设置/ }).click();
  await expect(page.getByRole("dialog", { name: "发布设置" })).toBeVisible();
  await expect(page.getByLabel("发布日期", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "收起发布设置" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".studio-masthead")).toBeVisible();
});

test("project editing retains homepage controls and a failed publication can be retried", async ({ page }) => {
  await page.goto("/?kind=project");
  await page.getByRole("button", { name: /发布设置/ }).click();
  await page.getByText("更多设置", { exact: false }).first().click();
  await page.getByLabel("首页排序", { exact: true }).fill("3");
  await page.evaluate(() => { (window as unknown as { __failSave: boolean }).__failSave = true; });
  await page.getByRole("button", { name: "更新项目" }).click();
  await expect(page.getByRole("status")).toContainText("网络暂时中断");
  await expect(page.getByRole("button", { name: "更新项目" })).toBeEnabled();
  await expect(page.getByRole("dialog")).toContainText("网络暂时中断");
  await page.evaluate(() => { (window as unknown as { __failSave: boolean }).__failSave = false; });
  await page.getByRole("button", { name: "更新项目" }).click();
  await expect(page.getByRole("status")).toContainText("项目已更新");
});

test("overview belongs to the same journal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?dashboard=1");
  await expect(page.getByRole("heading", { name: "内容管理" })).toBeVisible();
  await page.screenshot({ path: `${screenshots}/desktop-overview.png`, fullPage: true });
});

test("long manuscripts and summaries grow naturally; live edits retain other blocks", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "编辑第 2 段", exact: true }).click();
  await page.getByLabel("编辑当前段落").fill("这是一段即时编辑的 **新文字**。\n\n补充的新段落。");
  await page.getByLabel("标题", { exact: true }).click();
  await expect(page.locator(".live-manuscript strong").filter({ hasText: "新文字" })).toBeVisible();
  await page.screenshot({ path: `${screenshots}/desktop-live-writing.png`, fullPage: true });
  await page.getByRole("button", { name: "即时排版", exact: true }).click();
  const manuscript = page.getByLabel("Markdown", { exact: true });
  await expect(manuscript).toContainText("const journal");
  await manuscript.fill(Array.from({ length: 55 }, (_, i) => `## 第 ${i + 1} 节\n\n这是长篇编辑中的段落。`).join("\n\n"));
  await page.getByLabel("摘要", { exact: true }).fill("很长的摘要。".repeat(60));
  for (const input of [manuscript, page.getByLabel("摘要", { exact: true })]) {
    expect(await input.evaluate(element => element.scrollHeight <= element.clientHeight + 2)).toBe(true);
    await expect(input).toHaveCSS("overflow-y", "hidden");
  }
  await page.getByRole("button", { name: "对照", exact: true }).click();
  await expect(page.locator(".journal-source")).toHaveCSS("overflow-y", "visible");
  await expect(page.locator(".journal-preview")).toHaveCSS("overflow-y", "visible");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("body images appear once and the searchable document switcher uses a real modal", async ({ page }) => {
  await page.goto("/?kind=project&duplicate=1");
  await page.getByRole("button", { name: "预览", exact: true }).click();
  const reading = page.getByLabel("项目预览");
  await expect(reading.locator("img")).toHaveCount(1);
  await expect(reading.locator(".blog-article-cover")).toHaveCount(0);
  await page.getByRole("button", { name: "选择项目", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "切换项目" });
  await expect(dialog).toBeVisible();
  await page.getByLabel("搜索文章或项目").fill("不存在");
  await expect(dialog.getByRole("button", { name: /把一段想法/ })).toHaveCount(0);
  await page.getByLabel("搜索文章或项目").fill("想法");
  await expect(dialog.getByRole("button", { name: /把一段想法/ })).toBeVisible();
  await page.screenshot({ path: `${screenshots}/document-switcher.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "选择项目", exact: true })).toBeFocused();
});

test("photo contact sheet, search, centered upload and photo information desk", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?photos=1");
  await expect(page.locator(".studio-photograph-row")).toHaveCount(2);
  await page.screenshot({ path: `${screenshots}/desktop-photos.png`, fullPage: true });
  await page.getByLabel("搜索照片").fill("清晨");
  await expect(page.locator(".studio-photograph-row")).toHaveCount(1);
  await page.getByRole("button", { name: "上传照片" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: `${screenshots}/photo-upload.png` });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshots}/mobile-photos.png`, fullPage: true });
  await page.goto("/?photoEdit=1");
  await expect(page.getByRole("button", { name: "保存照片信息" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshots}/mobile-photo-edit.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: `${screenshots}/desktop-photo-edit.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("publication fields share a baseline and authors can create hashtags", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?kind=project");
  await page.getByRole("button", { name: /发布设置/ }).click();
  const date = await page.getByLabel("发布日期", { exact: true }).boundingBox();
  const tags = await page.locator(".journal-tag-control").boundingBox();
  expect(Math.abs(date!.y - tags!.y)).toBeLessThan(1);
  expect(date!.height).toBe(44);
  await page.getByLabel("添加标签").fill("#todo");
  await page.getByLabel("添加标签").press("Enter");
  await expect(page.locator(".journal-tag-token").filter({ hasText: "#todo" })).toBeVisible();
  await page.getByText("更多设置", { exact: false }).first().click();
  const slug = await page.getByLabel("公开地址", { exact: true }).boundingBox();
  const role = await page.getByLabel("项目角色", { exact: true }).boundingBox();
  expect(Math.abs(slug!.y - role!.y)).toBeLessThan(1);
  await page.screenshot({ path: `${screenshots}/aligned-project-publication.png` });
  await page.getByRole("button", { name: "更新项目" }).click();
  expect(await page.evaluate(() => (window as unknown as { __studioSubmissions: { tags: string }[] }).__studioSubmissions[0].tags)).toContain("todo");
});

test("content removal is reversible and keeps the existing action style", async ({ page }) => {
  await page.goto("/?dashboard=1");
  await page.getByRole("button", { name: /^删除/ }).click();
  await expect(page.getByRole("dialog", { name: "移至回收站" })).toBeVisible();
  await page.getByRole("button", { name: "移至回收站", exact: true }).click();
  await expect(page.locator(".studio-content-row")).toHaveCount(0);
  await page.getByRole("tab", { name: "回收站", exact: true }).click();
  await expect(page.locator(".studio-content-row")).toHaveCount(1);
  await page.getByRole("button", { name: "恢复", exact: true }).click();
  await expect(page.getByRole("heading", { name: "回收站为空" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: /^项目/ }).click();
  await expect(page.getByRole("button", { name: /^删除/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshots}/mobile-content-actions.png`, fullPage: true });
});

test("newspaper motion proposals are operable and preserve equal frames", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/prototypes/journal-motion-2026-10-20/index.html");
  const frames = page.locator(".frame");
  await expect(frames).toHaveCount(2);
  const boxes = await frames.evaluateAll(elements => elements.map(element => ({ width: element.clientWidth, height: element.clientHeight })));
  expect(boxes[0]).toEqual(boxes[1]);
  await page.screenshot({ path: `${screenshots}/motion-a-newspaper.png`, fullPage: true });
  await page.getByRole("button", { name: "下一版", exact: true }).click();
  await expect(page.locator("#demo")).toContainText("Lumi");
  await page.getByRole("button", { name: /B · 纵向分栏/ }).click();
  await expect(page.locator(".vertical .work")).toHaveCount(4);
  for (const card of await page.locator(".vertical .work").all()) { await card.scrollIntoViewIfNeeded(); await expect(card).toHaveCSS("opacity", "1"); }
  await page.screenshot({ path: `${screenshots}/motion-b-columns.png`, fullPage: true });
  await page.getByRole("button", { name: /C · 叠页索引/ }).click();
  await expect(page.locator(".stack .work")).toHaveCount(1);
  await page.screenshot({ path: `${screenshots}/motion-c-stack.png`, fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: /A · 报刊翻版/ }).click();
  await expect(page.locator(".sheet .work").first()).toHaveCSS("animation-name", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshots}/motion-a-mobile.png`, fullPage: true });
});
