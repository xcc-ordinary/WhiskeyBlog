# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a publicly deployable, desktop-first personal developer website with MDX projects and posts.

**Architecture:** Next.js App Router pages compose focused components and read validated MDX content through `lib/content.ts`. The content layer is server-only and returns typed summaries and documents; client code is limited to the persisted theme control. Static routes, metadata, tests, and CI are added as the site becomes functional.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, `gray-matter`, `next-mdx-remote`, Vitest, Playwright, GitHub Actions, Vercel.

## Global Constraints

- The interface and authored content use Simplified Chinese.
- Design desktop browser layouts first; add deliberate tablet/mobile reflow afterward.
- Use project screenshots and CSS-generated visuals only; every image needs useful alt text.
- Support system light/dark preference and an explicit visitor override.
- Honor `prefers-reduced-motion`; do not add accounts, comments, reactions, or server-backed forms.
- Keep credentials and `.env*` files out of Git; the repository remains public.
- A release passes linting, TypeScript checking, Vitest, Playwright smoke tests, and `next build`.

---

## File map

| Path | Responsibility |
| --- | --- |
| `app/` | App Router routes, page metadata, layout, 404, sitemap and robots files. |
| `components/site-header.tsx` | Shared desktop-first navigation and theme control placement. |
| `components/theme-toggle.tsx` | Client-side theme preference read/write and accessible toggle. |
| `components/project-card.tsx` | Reusable project preview. |
| `components/post-card.tsx` | Reusable article preview. |
| `components/mdx-content.tsx` | Renders trusted local MDX with a constrained component map. |
| `lib/content.ts` | Server-only content discovery, frontmatter validation, sorting and lookup. |
| `lib/site.ts` | Public site constants and navigation labels/URLs. |
| `content/projects/*.mdx` | Two launch project records. |
| `content/posts/*.mdx` | The launch article. |
| `tests/unit/content.test.ts` | Content sorting and missing-slug unit tests. |
| `tests/e2e/smoke.spec.ts` | Browser smoke path for home, project and article pages. |
| `.github/workflows/ci.yml` | Pull-request and main-branch quality gate. |

## Task 1: Create the Next.js foundation and quality commands

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`
- Modify: `README.md`

**Interfaces:**
- Produces: `npm run dev`, `npm run lint`, `npm run typecheck`, and `npm run build`.

- [ ] **Step 1: Scaffold the application without nesting a second repository**

Run from `C:\Users\16617\Desktop\WhiskeyBlog`:

```powershell
npx create-next-app@latest . --typescript --eslint --tailwind --app --use-npm --import-alias "@/*" --yes
```

Expected: `package.json`, `app/`, `public/`, and Next.js configuration files appear in the existing repository.

- [ ] **Step 2: Add a type-check script and verify the scaffold**

Change `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  }
}
```

Run:

```powershell
npm run lint; npm run typecheck; npm run build
```

Expected: all three commands exit with code `0`.

- [ ] **Step 3: Record the baseline**

```powershell
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs app public .gitignore README.md
git commit -m "chore: scaffold next application"
```

Expected: one commit containing only scaffold and baseline documentation files.

## Task 2: Establish typed site identity, tokens, and shell

**Files:**
- Create: `lib/site.ts`, `components/site-header.tsx`, `components/site-footer.tsx`, `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Produces: `site`, `navigation`, `<SiteHeader />`, `<SiteFooter />`, and `<ThemeToggle />`.

- [ ] **Step 1: Write the theme-toggle behavior test**

Create `tests/unit/theme.test.ts` with this expectation:

```ts
import { describe, expect, it } from "vitest";
import { nextTheme } from "@/lib/theme";

describe("nextTheme", () => {
  it("cycles system, light, dark", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});
```

- [ ] **Step 2: Install Vitest and run the intentionally failing test**

```powershell
npm install -D vitest
npm run test:unit -- tests/unit/theme.test.ts
```

Add `"test:unit": "vitest run"` to `package.json` first. Expected: failure because `@/lib/theme` does not yet exist.

- [ ] **Step 3: Implement the smallest theme utility**

Create `lib/theme.ts`:

```ts
export type ThemePreference = "system" | "light" | "dark";

export function nextTheme(theme: ThemePreference): ThemePreference {
  return { system: "light", light: "dark", dark: "system" }[theme];
}
```

Run `npm run test:unit -- tests/unit/theme.test.ts`. Expected: PASS.

- [ ] **Step 4: Build the shell**

Set `lib/site.ts` to export this stable identity:

```ts
export const site = {
  name: "WhiskeyBlog",
  description: "记录一名开发者持续学习与实践的个人网站。",
  githubUrl: "https://github.com/",
  email: "1661767494@qq.com",
} as const;

export const navigation = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于我" },
  { href: "/projects", label: "项目" },
  { href: "/blog", label: "博客" },
] as const;
```

Implement header, footer and theme toggle using semantic `header`, `nav`, `main`, `footer`, `<button aria-label>` and `next/link`. In `app/layout.tsx`, set `lang="zh-CN"`, export title/description metadata from `site`, wrap `children` with the header/footer, and add an inline pre-hydration script that reads `localStorage.theme` before paint. In `app/globals.css`, create `:root` and `[data-theme="dark"]` token sets for background, foreground, muted, panel, border and accent; use a desktop-first `min(1120px, calc(100% - 48px))` content container and a `prefers-reduced-motion` rule that removes transforms and uses short opacity transitions.

- [ ] **Step 5: Verify and commit**

```powershell
npm run lint; npm run typecheck; npm run test:unit
git add app components lib package.json package-lock.json tests/unit/theme.test.ts
git commit -m "feat: add site shell and theme preference"
```

Expected: all checks pass and the commit contains the shell only.

## Task 3: Add the MDX content model and launch records

**Files:**
- Create: `lib/content.ts`, `content/projects/whiskey-blog.mdx`, `content/projects/learning-lab.mdx`, `content/posts/building-this-site.mdx`, `tests/unit/content.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getProjects(): ProjectSummary[]`, `getPosts(): PostSummary[]`, `getProject(slug): ProjectDocument | null`, `getPost(slug): PostDocument | null`.

- [ ] **Step 1: Write a failing content contract test**

```ts
import { describe, expect, it } from "vitest";
import { getPost, getPosts } from "@/lib/content";

describe("post content", () => {
  it("sorts posts by date descending", () => {
    expect(getPosts().map((post) => post.slug)).toEqual(["building-this-site"]);
  });

  it("returns null for an unknown post", () => {
    expect(getPost("missing")).toBeNull();
  });
});
```

Run `npm run test:unit -- tests/unit/content.test.ts`. Expected: failure because the module is absent.

- [ ] **Step 2: Install the MDX dependencies**

```powershell
npm install gray-matter next-mdx-remote
```

- [ ] **Step 3: Implement the typed server-only reader**

Create `lib/content.ts` with `import "server-only"`, Node `fs` and `path`, plus these public types:

```ts
export type ContentMeta = { title: string; description: string; date: string; tags: string[]; slug: string };
export type ProjectSummary = ContentMeta & { kind: "project"; href: string };
export type PostSummary = ContentMeta & { kind: "post"; href: string };
export type ProjectDocument = ProjectSummary & { source: string };
export type PostDocument = PostSummary & { source: string };
```

Read only `.mdx` files, reject frontmatter missing a non-empty title, description, ISO date string, slug, or string-array tags, sort descending by `date`, and return `null` for a missing slug. Map project hrefs to `/projects/${slug}` and post hrefs to `/blog/${slug}`.

- [ ] **Step 4: Add representative Chinese MDX records**

Use this exact frontmatter shape in every record:

```mdx
---
title: "从零搭建 WhiskeyBlog"
description: "用真实项目学习 Next.js、内容建模与部署。"
date: "2026-07-21"
tags: ["Next.js", "学习记录"]
slug: "building-this-site"
---

# 从零搭建 WhiskeyBlog

这篇文章记录网站从想法到第一个公开版本的过程。
```

Create two analogous project records, with slugs `whiskey-blog` and `learning-lab`, using explicitly marked draft descriptions that must be replaced with the owner's actual project facts before launch.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit -- tests/unit/content.test.ts; npm run typecheck
git add content lib/content.ts tests/unit/content.test.ts package.json package-lock.json
git commit -m "feat: add typed mdx content"
```

Expected: reader tests and typecheck pass.

## Task 4: Build reusable content previews and MDX rendering

**Files:**
- Create: `components/project-card.tsx`, `components/post-card.tsx`, `components/mdx-content.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `ProjectSummary`, `PostSummary`, and MDX `source` from `lib/content.ts`.
- Produces: cards with accessible links and `MdxContent({ source: string })`.

- [ ] **Step 1: Write component assertions**

Create `tests/unit/cards.test.tsx` with a project card rendered from `{ title: "WhiskeyBlog", description: "个人网站", date: "2026-07-21", tags: ["Next.js"], slug: "whiskey-blog", kind: "project", href: "/projects/whiskey-blog" }` and assert a link named `WhiskeyBlog` whose `href` is `/projects/whiskey-blog`.

- [ ] **Step 2: Install React test support and prove failure**

```powershell
npm install -D @testing-library/react @testing-library/jest-dom jsdom
npm run test:unit -- tests/unit/cards.test.tsx
```

Configure Vitest with `environment: "jsdom"` for `tests/unit/**/*.test.tsx`. Expected: failure because `ProjectCard` is absent.

- [ ] **Step 3: Implement cards and renderer**

`ProjectCard` and `PostCard` must accept one `project` or `post` prop, render an `<article>`, a `next/link`, the title, description, formatted Chinese date, and a list of tags. `MdxContent` must call `compileMDX` from `next-mdx-remote/rsc` using only local source and render `h1`, `h2`, `p`, `a`, `ul`, `ol`, and `code` through semantic styled components. Do not accept MDX from a request or database.

- [ ] **Step 4: Add desktop-first card styles**

Add reusable `.card-grid` (two columns from 768px upward), `.content-card`, `.tag`, and `.prose` classes. Cards use token colors, clear focus-visible outlines, a short transform hover only where reduced motion is not requested, and no fixed text height that could crop Chinese text.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit -- tests/unit/cards.test.tsx; npm run lint; npm run typecheck
git add components app/globals.css tests/unit/cards.test.tsx vitest.config.ts package.json package-lock.json
git commit -m "feat: add reusable content presentation"
```

## Task 5: Implement all public pages and metadata

**Files:**
- Create: `app/about/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: content getters and card/MDX components.
- Produces: public routes `/`, `/about`, `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, plus 404, sitemap and robots output.

- [ ] **Step 1: Write a failing route smoke test**

Create a Playwright test that opens `/`, clicks the `项目` navigation link, opens the `WhiskeyBlog` project link, then opens `/blog/building-this-site`, asserting the corresponding Chinese headings are visible.

- [ ] **Step 2: Install and configure Playwright**

```powershell
npm init playwright@latest -- --yes --browser=chromium
npx playwright install chromium
```

Set Playwright `webServer.command` to `npm run dev`, `webServer.url` to `http://127.0.0.1:3000`, and add `"test:e2e": "playwright test"` to `package.json`. Run `npm run test:e2e`; expected: failure before routes exist.

- [ ] **Step 3: Implement pages**

Home displays the growing-developer introduction, a primary `查看项目` link, the two project cards and the latest post card. About uses honest, editable draft copy and public GitHub/email links. Projects and blog pages list all corresponding records. Dynamic pages call `notFound()` for `null` lookup values, export `generateStaticParams()` from current content slugs, export per-document `generateMetadata()`, and render `MdxContent`.

`not-found.tsx` must contain a visible `页面未找到` heading plus a link back to `/`. `sitemap.ts` returns all static pages and content hrefs using the future `NEXT_PUBLIC_SITE_URL` when defined, otherwise `http://localhost:3000`. `robots.ts` allows `/` and points to `/sitemap.xml`.

- [ ] **Step 4: Run the browser test until it passes**

```powershell
npm run test:e2e
```

Expected: Chromium smoke test passes for the home, project and blog paths.

- [ ] **Step 5: Verify and commit**

```powershell
npm run lint; npm run typecheck; npm run build; npm run test:e2e
git add app tests/e2e playwright.config.ts package.json package-lock.json
git commit -m "feat: add portfolio and blog routes"
```

## Task 6: Finish production quality, CI, and handoff documentation

**Files:**
- Create: `.github/workflows/ci.yml`, `.env.example`
- Modify: `README.md`, `.gitignore`

**Interfaces:**
- Produces: a documented local workflow and a GitHub Actions gate for install, lint, typecheck, unit tests, build and browser smoke test.

- [ ] **Step 1: Add a failing CI-local command**

Run this exact sequence locally before creating CI:

```powershell
npm ci; npm run lint; npm run typecheck; npm run test:unit; npm run build; npm run test:e2e
```

Expected: if any command fails, fix its concrete failure before continuing; no command may be removed from the release gate.

- [ ] **Step 2: Add the GitHub Actions workflow**

Use Node 24, `actions/checkout@v4`, `actions/setup-node@v4` with `cache: npm`, `npm ci`, Chromium installation, and the six commands from Step 1. Trigger on pushes and pull requests to `main`.

- [ ] **Step 3: Document local setup and deployment**

README must contain: prerequisites (Node 20.9+), `npm install`, `npm run dev`, each quality command, MDX frontmatter contract, how to replace launch draft facts, secret policy, GitHub repository creation, Vercel import/deploy, optional `NEXT_PUBLIC_SITE_URL`, and post-deploy checks for desktop, mobile reflow, theme, keyboard navigation, metadata and analytics.

`.env.example` contains only:

```dotenv
NEXT_PUBLIC_SITE_URL=https://example.vercel.app
```

- [ ] **Step 4: Perform the release verification and commit**

```powershell
npm ci; npm run lint; npm run typecheck; npm run test:unit; npm run build; npm run test:e2e
git add .github .env.example .gitignore README.md
git commit -m "ci: add release verification workflow"
```

Expected: all commands exit with code `0`; the Git working tree is clean.

## Spec coverage review

- Chinese personal developer positioning, navigation and launch content: Tasks 2, 3 and 5.
- Desktop-first lively Apple-inspired system, dark theme, reduced motion and accessibility: Tasks 2 and 4.
- MDX projects/posts, validation, detail routes and 404: Tasks 3 and 5.
- Unit tests, end-to-end smoke test, GitHub/Vercel deployment and analytics handoff: Tasks 2, 5 and 6.
- Privacy and no-backend scope: Global Constraints, Task 2 identity, and Task 6 documentation.

## Plan self-review

The plan contains six independently testable tasks, establishes public interfaces before consuming them, and requires a passing check suite before each commit. No open decisions or unassigned requirements remain; draft launch facts are explicitly limited to owner-supplied details before production release.
