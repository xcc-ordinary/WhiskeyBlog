import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { expect, test } from "@playwright/test";

test("homepage selection and project pages use the same saved project content", async ({ page }) => {
  const directory = path.join(process.cwd(), "content", "projects");
  const projects = readdirSync(directory).filter(file => file.endsWith(".mdx")).map(file => matter(readFileSync(path.join(directory, file), "utf8")).data);
  const featured = projects.filter(project => project.featured !== false).sort((a, b) => (a.homeOrder ?? 999) - (b.homeOrder ?? 999) || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const teasers = page.locator('.edition-work-teaser[href^="/projects/"]');
  await expect(teasers).toHaveCount(featured.length);
  for (let index = 0; index < featured.length; index++) {
    const project = featured[index];
    await expect(teasers.nth(index)).toHaveAttribute("href", `/projects/${project.slug}`);
    await expect(teasers.nth(index).locator(".edition-teaser-title")).toContainText(project.title);
    await expect(teasers.nth(index).locator(".edition-teaser-description")).toHaveText(project.description);
    if (project.coverImage) {
      await expect(teasers.nth(index).locator("img")).toHaveAttribute("src", new RegExp(encodeURIComponent(project.coverImage)));
    }
  }
  await page.locator(".editorial-header-actions .language-toggle").click();
  for (let index = 0; index < featured.length; index++) {
    await expect(teasers.nth(index).locator(".edition-teaser-title")).toContainText(featured[index].titleEn || featured[index].title);
    await expect(teasers.nth(index).locator(".edition-teaser-description")).toHaveText(featured[index].descriptionEn || featured[index].description);
  }
  if (featured.length) {
    const project = featured[0];
    await page.goto(`/projects/${project.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
    await expect(page.locator(".blog-article-deck")).toHaveText(project.description);
    await expect(page.locator(".blog-article-reading-layout > .prose")).toBeVisible();
    if (project.coverImage) {
      const cover = page.locator(".project-article-cover img");
      await expect(cover).toBeVisible();
      await expect(cover).toHaveCSS("object-fit", "contain");
    }
  }
});
