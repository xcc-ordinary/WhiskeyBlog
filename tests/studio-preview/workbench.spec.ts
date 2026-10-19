import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const screenshots = "design/studio-journal-2026-10-19";
test.beforeAll(async () => { await mkdir(screenshots, { recursive: true }); });

test("desktop journal, full-size reading proof and explicit publishing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
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
  await page.screenshot({ path: `${screenshots}/desktop-publishing.png`, fullPage: true });
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
  await expect(page.getByLabel("公开地址", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "收起发布设置" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".studio-masthead")).toBeVisible();
});

test("project editing retains homepage controls and a failed publication can be retried", async ({ page }) => {
  await page.goto("/?kind=project");
  await page.getByRole("button", { name: /发布设置/ }).click();
  await page.getByText("首页展示与英文信息", { exact: true }).click();
  await page.getByLabel("首页排序", { exact: true }).fill("3");
  await page.evaluate(() => { (window as unknown as { __failSave: boolean }).__failSave = true; });
  await page.getByRole("button", { name: "更新项目" }).click();
  await expect(page.getByRole("status")).toContainText("网络暂时中断");
  await expect(page.getByRole("button", { name: "更新项目" })).toBeEnabled();
  await expect(page.getByLabel("项目笔记（Markdown）")).toContainText("具体的问题");
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
