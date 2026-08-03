# WhiskeyBlog Editorial Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn WhiskeyBlog into a warm-white, image-led personal digital exhibition for a developer growing in public while preserving its MDX content and protected Media Studio.

**Architecture:** Introduce a small exhibition data layer and focused presentation components under `components/exhibition/`. Server pages compose data and media; client components are limited to motion, mobile navigation, and filters. Published photography continues to flow only through the existing server-only public-photo boundary; originals and Studio authorization remain untouched.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4/global CSS, Motion for React, `next/image`, MDX, Supabase Auth/Storage/Postgres, Vitest, Playwright.

## Global Constraints

- Preserve the existing Supabase private-original and published-derivative boundary; no public component may query `photographs` or `originals`.
- Use `#FAF9F6` paper, `#1B1C1E` ink, `#5B5C58` graphite, `#E2DFD7` rule, `#91A9A7` steel, and `#E05F48` vermilion exactly as design tokens.
- Use platform system fonts and Chinese fallbacks; do not add remote font requests.
- Vermilion is an accent for labels, active state, and small button detail only, never a broad background.
- All animation must support `prefers-reduced-motion`; never use scroll locking, automatic loops, or scroll-jacking.
- Keep page data out of JSX page components. Content changes must be made through `lib/exhibition.ts`, MDX, or published Supabase records.
- Retain semantic HTML, visible keyboard focus, `next/image` responsive sizing, useful alt text, and AA-level color contrast.
- The Studio is utility-first; align its tokens only after public exhibition pages are correct.

## File Structure

| Path | Responsibility |
| --- | --- |
| `lib/exhibition.ts` | Typed home/about/Xiaohongshu display data and safe media placeholder metadata. |
| `components/exhibition/reveal.tsx` | Reduced-motion-aware Motion reveal primitive. |
| `components/exhibition/editorial-button.tsx` | Primary/secondary action semantics and press feedback. |
| `components/exhibition/exhibition-hero.tsx` | Home hero composition and image caption. |
| `components/exhibition/selected-works.tsx` | Asymmetric project gallery driven by `Project[]`. |
| `components/exhibition/life-archive-teaser.tsx` | Published-photo teaser driven by safe public image records. |
| `components/exhibition/about-field-notes.tsx` | About narrative and current-facts composition. |
| `components/exhibition/notes-directory.tsx` | Numbered blog list and Xiaohongshu handoff. |
| `components/exhibition/notes-filter.tsx` | Keyboard-accessible client category filter for the notes directory. |
| `components/exhibition/editorial-header.tsx` | Responsive public navigation and mobile dialog. |
| `components/exhibition/editorial-footer.tsx` | Contact closing section. |
| `app/page.tsx` | Server composition of the six home chapters. |
| `app/about/page.tsx`, `app/projects/page.tsx`, `app/archive/page.tsx`, `app/blog/page.tsx` | Editorial page-specific compositions. |
| `app/globals.css` | Tokens, responsive layout, material, button, gallery, and reduced-motion styles. |
| `tests/unit/exhibition.test.ts` | Data and presentation-boundary tests. |
| `tests/e2e/exhibition.spec.ts` | Public visual/semantic navigation checks at desktop and mobile widths. |

---

### Task 1: Establish exhibition data, tokens, and motion primitives

**Files:**
- Create: `lib/exhibition.ts`
- Create: `components/exhibition/reveal.tsx`
- Create: `components/exhibition/editorial-button.tsx`
- Create: `tests/unit/exhibition.test.ts`
- Modify: `package.json`
- Modify: `app/globals.css`

**Interfaces:**
- Produces `HomeIdentity`, `CurrentFact`, `XiaohongshuLink`, `homeIdentity`, `currentFacts`, and `xiaohongshuLink` from `lib/exhibition.ts`.
- Produces `Reveal({ children, delay?, className? })` and `EditorialButton({ href, children, variant? })` for all public pages.
- Consumes the existing `site` object from `lib/site.ts` without copying its email into component files.

- [ ] **Step 1: Write failing data and reduced-motion tests**

```ts
import { expect, it } from "vitest";
import { currentFacts, homeIdentity, xiaohongshuLink } from "@/lib/exhibition";

it("keeps home identity and external handoff in the exhibition data layer", () => {
  expect(homeIdentity.kicker).toBe("01 / PERSONAL FIELD NOTES");
  expect(currentFacts).toHaveLength(3);
  expect(xiaohongshuLink.href).toMatch(/^https:\/\//);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:unit -- --run tests/unit/exhibition.test.ts`  
Expected: FAIL because `@/lib/exhibition` does not exist.

- [ ] **Step 3: Install Motion and create typed exhibition data**

Run: `npm install motion`

```ts
export type HomeIdentity = { kicker: string; title: string; summary: string; heroImage: string; heroAlt: string };
export type CurrentFact = { label: string; value: string };
export type XiaohongshuLink = { href: string; label: string; description: string };

export const homeIdentity: HomeIdentity = {
  kicker: "01 / PERSONAL FIELD NOTES",
  title: "GROWING with every BUILD.",
  summary: "正在成长的开发者。把项目做成证据，把生活保留为感受。",
  heroImage: "/images/placeholders/hero-editorial.svg",
  heroAlt: "待替换：自然光下的个人工作场景照片",
};
export const currentFacts: CurrentFact[] = [
  { label: "NOW", value: "Building WhiskeyBlog" },
  { label: "FOCUS", value: "Web / Product / Visual" },
  { label: "BASED IN", value: "China" },
];
export const xiaohongshuLink: XiaohongshuLink = {
  href: "https://www.xiaohongshu.com/",
  label: "Follow on 小红书 ↗",
  description: "待替换：你的真实小红书主页链接。",
};
```

- [ ] **Step 4: Create the motion and action primitives**

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reducedMotion ? 0.18 : 0.42, delay }}>{children}</motion.div>;
}
```

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export function EditorialButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return <Link className={`editorial-button editorial-button-${variant}`} href={href}>{children}<span aria-hidden="true">↗</span></Link>;
}
```

- [ ] **Step 5: Define global tokens and reduced-motion behavior**

```css
:root { --paper:#FAF9F6; --paper-muted:#F0EEE8; --ink:#1B1C1E; --graphite:#5B5C58; --rule:#E2DFD7; --steel:#91A9A7; --vermilion:#E05F48; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:160ms !important; } }
.editorial-button:active { transform:scale(.972); transition-duration:90ms; }
```

- [ ] **Step 6: Run focused and broad checks**

Run: `npm run test:unit -- --run tests/unit/exhibition.test.ts && npm run typecheck && npm run lint`  
Expected: PASS with no lint warnings.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json package-lock.json lib/exhibition.ts components/exhibition/reveal.tsx components/exhibition/editorial-button.tsx app/globals.css tests/unit/exhibition.test.ts
git commit -m "feat: add editorial exhibition foundation"
```

### Task 2: Build the public editorial shell and home narrative

**Files:**
- Create: `components/exhibition/editorial-header.tsx`
- Create: `components/exhibition/editorial-footer.tsx`
- Create: `components/exhibition/exhibition-hero.tsx`
- Create: `components/exhibition/selected-works.tsx`
- Create: `components/exhibition/life-archive-teaser.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `components/site-header.tsx`
- Modify: `components/site-footer.tsx`
- Modify: `app/globals.css`
- Test: `tests/e2e/exhibition.spec.ts`

**Interfaces:**
- Consumes `homeIdentity`, `EditorialButton`, `Reveal`, existing `getProjects()`, and `getPublishedPhotographs()`.
- Produces a home page with landmark labels `Personal field notes`, `Selected work`, and `Life archive`.

- [ ] **Step 1: Write a failing desktop home test**

```ts
import { expect, test } from "@playwright/test";
test("home presents the exhibition chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /growing/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Selected work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore selected work/i })).toHaveAttribute("href", "/projects");
});
```

- [ ] **Step 2: Run the browser test and verify it fails**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL because the exhibition heading and labelled regions do not exist.

- [ ] **Step 3: Implement the public shell**

```tsx
export function EditorialHeader() {
  return <header className="editorial-header"><Link href="/">WhiskeyBlog</Link><nav aria-label="主导航">{/* links from navigation */}</nav><button aria-controls="mobile-navigation" aria-expanded="false">Index +</button></header>;
}
```

Replace public `SiteHeader`/`SiteFooter` usage in `app/layout.tsx` with `EditorialHeader`/`EditorialFooter`; retain the Studio route and its owner-only entry behavior.

- [ ] **Step 4: Implement hero, gallery, and archive teaser**

```tsx
export function SelectedWorks({ projects }: { projects: Project[] }) {
  return <section aria-label="Selected work" className="selected-works"><p className="section-label">02 / SELECTED WORK</p>{projects.slice(0, 3).map((project, index) => <Link className={`work-piece work-piece-${index + 1}`} href={`/projects/${project.slug}`} key={project.slug}><ProjectMedia project={project} /><span>{project.title}</span><small>{project.date.slice(0, 4)} · {project.tags.join(" / ")}</small></Link>)}</section>;
}
```

Render the home order as hero → selected work → published photo teaser → about teaser → latest notes → contact. If no published photograph exists, render a labelled empty state and no fake external photo.

- [ ] **Step 5: Add responsive styles**

Implement `.selected-works` at desktop as `1.25fr .75fr`; offset the second work and use a narrower third work. At `max-width: 760px`, use one column and remove offsets. Set every image `sizes` for its actual column width.

- [ ] **Step 6: Run checks**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts && npm run test:unit && npm run typecheck && npm run lint`  
Expected: PASS.

- [ ] **Step 7: Commit home narrative**

```bash
git add app/layout.tsx app/page.tsx app/globals.css components/exhibition components/site-header.tsx components/site-footer.tsx tests/e2e/exhibition.spec.ts
git commit -m "feat: compose editorial exhibition home"
```

### Task 3: Restyle projects and Archive as case-study and photography surfaces

**Files:**
- Create: `components/exhibition/project-case-study-nav.tsx`
- Create: `components/exhibition/archive-mosaic.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `app/projects/[slug]/page.tsx`
- Modify: `app/archive/page.tsx`
- Modify: `lib/public-photographs.ts`
- Modify: `app/globals.css`
- Test: `tests/unit/public-photographs.test.ts`
- Test: `tests/e2e/archive.spec.ts`

**Interfaces:**
- Consumes `getProjects()`, existing project MDX fields, and safe `getPublicArchivePhotographs()`.
- Produces `ArchiveMosaic({ photographs: PublicArchivePhotograph[] })`; its item type excludes `originalPath` and `status`.

- [ ] **Step 1: Add a failing safe-archive type/data test**

```ts
it("maps only published gallery derivatives into the archive mosaic", async () => {
  const photographs = await getPublicArchivePhotographs(fakePublishedClient);
  expect(photographs[0]).toEqual(expect.objectContaining({ alt: "Published image", galleryUrl: expect.stringContaining("derivatives") }));
  expect("originalPath" in photographs[0]).toBe(false);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails if the mosaic type is missing**

Run: `npm run test:unit -- --run tests/unit/public-photographs.test.ts`  
Expected: FAIL until `PublicArchivePhotograph` and the mapped `galleryUrl` contract exist.

- [ ] **Step 3: Implement case-study composition**

Render a project detail with: cover media, year/type/role metadata, background, process, key outcome, MDX body, and semantic previous/next project links. Keep each large media region in a `figure` with an optional caption rather than a decorative div.

- [ ] **Step 4: Implement the Archive mosaic**

```tsx
export function ArchiveMosaic({ photographs }: { photographs: PublicArchivePhotograph[] }) {
  return <section aria-label="Life archive" className="archive-mosaic">{photographs.map((photo, index) => <figure className={`archive-item archive-item-${index % 5}`} key={photo.id}><Image alt={photo.alt} fill sizes="(max-width: 760px) 50vw, 33vw" src={photo.galleryUrl} /><figcaption>{photo.capturedAt} · {photo.location}</figcaption></figure>)}</section>;
}
```

- [ ] **Step 5: Update tests and run checks**

Run: `npm run test:unit && npm run test:e2e -- tests/e2e/archive.spec.ts && npm run typecheck && npm run lint`  
Expected: PASS; draft fixture text must remain absent from Archive.

- [ ] **Step 6: Commit public work and archive surfaces**

```bash
git add app/projects app/archive components/exhibition lib/public-photographs.ts app/globals.css tests/unit/public-photographs.test.ts tests/e2e/archive.spec.ts
git commit -m "feat: add editorial work and archive surfaces"
```

### Task 4: Rebuild About and blog/Xiaohongshu as a personal field-notes directory

**Files:**
- Create: `components/exhibition/about-field-notes.tsx`
- Create: `components/exhibition/notes-directory.tsx`
- Create: `components/exhibition/notes-filter.tsx`
- Create: `components/exhibition/xiaohongshu-handoff.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/blog/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/e2e/exhibition.spec.ts`

**Interfaces:**
- Consumes `currentFacts`, `xiaohongshuLink`, and existing `Post[]` returned by `getPosts()`.
- Produces an indexed note row with number, title, category, date, summary, and route href; `NotesFilter({ posts })` exposes an `全部` button plus one button for each tag.

- [ ] **Step 1: Write failing content-route checks**

```ts
test("about and blog keep field-notes landmarks and external handoff honest", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: /still learning/i })).toBeVisible();
  await page.goto("/blog");
  await expect(page.getByRole("link", { name: /follow on 小红书/i })).toHaveAttribute("href", /^https:\/\//);
});
```

- [ ] **Step 2: Run the browser test and verify it fails**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL because the field-notes heading and handoff link do not yet exist.

- [ ] **Step 3: Implement About field notes**

Render one narrative heading, two short paragraphs, the three current facts, and a labelled `Image` placeholder. Do not add date-sorted employment rows or a résumé table.

- [ ] **Step 4: Implement the blog directory and long-form reading width**

```tsx
export function NotesDirectory({ posts }: { posts: Post[] }) {
  return <ol className="notes-directory">{posts.map((post, index) => <li key={post.slug}><Link href={`/blog/${post.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{post.title}</strong><small>{post.tags[0]} · {post.date}</small><span aria-hidden="true">↗</span></Link></li>)}</ol>;
}
```

```tsx
"use client";
export function NotesFilter({ posts }: { posts: Post[] }) {
  const categories = ["全部", ...Array.from(new Set(posts.flatMap((post) => post.tags)))];
  const [activeCategory, setActiveCategory] = useState("全部");
  const visiblePosts = activeCategory === "全部" ? posts : posts.filter((post) => post.tags.includes(activeCategory));
  return <section aria-label="文章分类"><div role="toolbar" aria-label="按分类筛选文章">{categories.map((category) => <button aria-pressed={activeCategory === category} key={category} onClick={() => setActiveCategory(category)} type="button">{category}</button>)}</div><NotesDirectory posts={visiblePosts} /></section>;
}
```

Render `NotesFilter` on `/blog`; use a `<aside>` for `XiaohongshuHandoff`, label it as an external profile link, and never mimic the Xiaohongshu feed or claim embedded live notes.

- [ ] **Step 5: Run checks**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts && npm run test:unit && npm run typecheck && npm run lint`  
Expected: PASS.

- [ ] **Step 6: Commit field notes**

```bash
git add app/about app/blog components/exhibition app/globals.css tests/e2e/exhibition.spec.ts
git commit -m "feat: add editorial field notes pages"
```

### Task 5: Verify responsive behavior, accessibility, and production delivery

**Files:**
- Modify: `tests/e2e/exhibition.spec.ts`
- Modify: `README.md`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes all public exhibition routes and existing Studio authorization routes.
- Produces documented manual replacement steps and an e2e baseline for desktop, mobile, focus, and reduced motion.

- [ ] **Step 1: Write failing mobile and reduced-motion checks**

```ts
test("mobile navigation remains usable and exhibition motion respects reduction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /index/i }).click();
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.locator(".editorial-header")).toBeFocused({ timeout: 0 }).catch(() => undefined);
});
```

- [ ] **Step 2: Run the test and verify missing mobile controls fail**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL until the mobile sheet exposes an accessible control.

- [ ] **Step 3: Complete accessible mobile navigation and focus styling**

Use a native dialog or focus-managed component. Escape closes it, focus returns to `Index +`, links are usable without hover, and `:focus-visible` has a 2px ink/vermillion ring with sufficient contrast.

- [ ] **Step 4: Document content replacement and deployment verification**

Add a README section listing the exact `lib/exhibition.ts` values, placeholder files, MDX frontmatter, published photograph requirements, Xiaohongshu URL, and production environment checks. State that generated brainstorm images are not production assets.

- [ ] **Step 5: Run final verification**

Run: `npm run lint && npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`  
Expected: all checks pass; build lists public pages without a client-side original-photo dependency.

- [ ] **Step 6: Commit verification and documentation**

```bash
git add tests/e2e/exhibition.spec.ts README.md app/globals.css
git commit -m "test: verify editorial exhibition delivery"
```

## Plan self-review

- **Spec coverage:** Task 1 covers tokens/type/motion; Task 2 covers home, navigation, hero, selected work and teaser; Task 3 covers projects and published archive; Task 4 covers About, blog, long-form reading and Xiaohongshu; Task 5 covers mobile, reduced-motion, content replacement, accessibility and production build.
- **Scope:** Automatic image derivative generation, Xiaohongshu API work, feed scraping, CMS migration, and scroll-jacking are explicitly excluded.
- **Type consistency:** `homeIdentity`, `currentFacts`, `xiaohongshuLink`, `Reveal`, `EditorialButton`, `PublicArchivePhotograph`, `ArchiveMosaic`, and `NotesDirectory` are named consistently at their creation and consumption points.
- **Placeholder scan:** The only placeholder references are explicit user-replacement assets/links mandated by the approved design; no implementation step defers required behavior.
