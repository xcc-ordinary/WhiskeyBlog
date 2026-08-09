# Cinematic Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible desktop-only Lenis camera-glide scroll experience with restrained Motion parallax on the public exhibition surfaces.

**Architecture:** A client-only `SmoothScrollProvider` enhances the real document scroller after hydration, only for eligible desktop users. A small `Parallax` wrapper maps document progress to bounded transforms for opted-in visual media; content pages keep their semantic structure and never own scroll listeners. Existing reduced-motion behavior is preserved as a complete native-scroll fallback.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Lenis, Motion, Vitest, Playwright.

## Global Constraints

- Install and use `lenis`; do not introduce Locomotive Scroll, GSAP, canvas, WebGL, full-screen snapping, pinned chapters, or a translated virtual scroll container.
- Server and first client render must remain static and identical. No `typeof window` render branch and no `suppressHydrationWarning`.
- Lenis is allowed only after hydration on desktop fine-pointer layouts, never when `prefers-reduced-motion: reduce`, `pointer: coarse`, or viewport width is at most 760px.
- Use only `transform` and `opacity` for continuous effects. Each parallax range is bounded and applies to image media, never required reading text.
- Native scrolling, focus navigation, hash navigation, browser history, mobile touch scrolling, Studio dialogs, and existing public route semantics must remain usable.
- Preserve all current Studio/Auth/Supabase/RLS/upload behavior and the public photograph derivative boundary.
- Follow existing Simplified Chinese accessible-label conventions. Keep deliberate existing English editorial copy unchanged.

---

## File structure

- `lib/scroll-eligibility.ts`: pure environment-to-eligibility decision with no React dependency.
- `components/exhibition/smooth-scroll-provider.tsx`: Lenis lifecycle, hydration-safe enhancement and path/hash synchronization.
- `components/exhibition/parallax.tsx`: a bounded, reusable Motion transform wrapper for visual content.
- `app/layout.tsx`: wraps public layout contents in the provider without changing semantic `header/main/footer` order.
- `components/exhibition/exhibition-hero.tsx`: declares the strongest hero visual/copy depth layers.
- `components/exhibition/life-archive-teaser.tsx`, `components/exhibition/archive-mosaic.tsx`, `components/exhibition/project-media.tsx`: opt into small, bounded visual-only drift.
- `app/globals.css`: imports Lenis CSS, scopes scroll-motion styles, retains CSS reduced-motion/mobile fallbacks.
- `tests/unit/scroll-eligibility.test.ts`: deterministic eligibility cases.
- `tests/e2e/exhibition.spec.ts`: hydration, reduced-motion/mobile native behavior and desktop enhancement checks.

### Task 1: Define the motion eligibility contract and add Lenis

**Files:**
- Create: `lib/scroll-eligibility.ts`
- Create: `tests/unit/scroll-eligibility.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `ScrollEnvironment` supplied by browser-only code.
- Produces: `shouldEnhanceScroll(environment: ScrollEnvironment): boolean` for the provider.

- [ ] **Step 1: Write the failing pure eligibility tests**

```ts
import { describe, expect, it } from "vitest";
import { shouldEnhanceScroll } from "@/lib/scroll-eligibility";

describe("shouldEnhanceScroll", () => {
  it("allows a hydrated desktop fine-pointer user", () => {
    expect(shouldEnhanceScroll({ hasHydrated: true, reducedMotion: false, coarsePointer: false, viewportWidth: 1280 })).toBe(true);
  });

  it.each([
    { hasHydrated: false, reducedMotion: false, coarsePointer: false, viewportWidth: 1280 },
    { hasHydrated: true, reducedMotion: true, coarsePointer: false, viewportWidth: 1280 },
    { hasHydrated: true, reducedMotion: false, coarsePointer: true, viewportWidth: 1280 },
    { hasHydrated: true, reducedMotion: false, coarsePointer: false, viewportWidth: 760 },
  ])("keeps native scrolling for ineligible environments", (environment) => {
    expect(shouldEnhanceScroll(environment)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:unit -- --run tests/unit/scroll-eligibility.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add Lenis and implement the pure contract**

Run: `npm install lenis`

```ts
export type ScrollEnvironment = {
  hasHydrated: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
};

export function shouldEnhanceScroll(environment: ScrollEnvironment): boolean {
  return environment.hasHydrated
    && !environment.reducedMotion
    && !environment.coarsePointer
    && environment.viewportWidth > 760;
}
```

- [ ] **Step 4: Run focused and project checks**

Run: `npm run test:unit -- --run tests/unit/scroll-eligibility.test.ts && npm run typecheck && npm run lint`  
Expected: PASS.

- [ ] **Step 5: Commit the contract**

```bash
git add package.json package-lock.json lib/scroll-eligibility.ts tests/unit/scroll-eligibility.test.ts
git commit -m "feat: define cinematic scroll eligibility"
```

### Task 2: Enhance the real document scroll after hydration

**Files:**
- Create: `components/exhibition/smooth-scroll-provider.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/exhibition.spec.ts`

**Interfaces:**
- Consumes: `shouldEnhanceScroll`, Lenis default export, `usePathname`, `useReducedMotion` and children.
- Produces: `SmoothScrollProvider({ children }: { children: ReactNode }): JSX.Element`; it adds `data-smooth-scroll="enabled"` to `document.documentElement` only after Lenis successfully starts.

- [ ] **Step 1: Add a failing browser assertion for the desktop enhancement and reduced-motion fallback**

```ts
test("desktop enables camera glide while reduced motion stays native", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect.poll(() => page.locator("html").getAttribute("data-smooth-scroll")).toBe("enabled");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-smooth-scroll", "enabled");
});
```

- [ ] **Step 2: Run the browser test and confirm the enhancement assertion fails**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL because `data-smooth-scroll` is never set.

- [ ] **Step 3: Implement hydration-safe Lenis enhancement**

```tsx
"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { shouldEnhanceScroll } from "@/lib/scroll-eligibility";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [environment, setEnvironment] = useState({ hasHydrated: false, coarsePointer: true, viewportWidth: 0 });
  const enabled = shouldEnhanceScroll({ ...environment, reducedMotion: Boolean(reducedMotion) });

  useEffect(() => {
    const refresh = () => setEnvironment({ hasHydrated: true, coarsePointer: window.matchMedia("(pointer: coarse)").matches, viewportWidth: window.innerWidth });
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, anchors: true });
    document.documentElement.dataset.smoothScroll = "enabled";
    return () => { lenis.destroy(); delete document.documentElement.dataset.smoothScroll; };
  }, [enabled]);

  useEffect(() => {
    if (enabled && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [enabled, pathname]);

  return <>{children}</>;
}
```

Wrap the existing header, main and footer in `SmoothScrollProvider` without altering their order. Import `lenis/dist/lenis.css` from the global CSS entry point. Add only scoped rules required by Lenis and ensure the existing reduced-motion CSS forces native behavior.

- [ ] **Step 4: Run browser, hydration and accessibility checks**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts && npm run typecheck && npm run lint`  
Expected: PASS, including existing mobile dialog and reduced-motion hydration tests.

- [ ] **Step 5: Commit global enhancement**

```bash
git add app/layout.tsx app/globals.css components/exhibition/smooth-scroll-provider.tsx tests/e2e/exhibition.spec.ts
git commit -m "feat: add smooth scroll enhancement"
```

### Task 3: Add a reusable bounded parallax primitive

**Files:**
- Create: `components/exhibition/parallax.tsx`
- Create: `tests/unit/parallax.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `children`, `speed: number`, optional `className`, and Motion scroll APIs.
- Produces: `Parallax({ children, speed, className }: { children: ReactNode; speed: number; className?: string }): JSX.Element` where `speed` is clamped to `[-0.2, 0.2]`.

- [ ] **Step 1: Write a failing clamp test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Parallax } from "@/components/exhibition/parallax";

it("keeps visual parallax within the documented speed bounds", () => {
  render(<Parallax speed={3}><span>visual layer</span></Parallax>);
  expect(screen.getByTestId("parallax-layer")).toHaveAttribute("data-speed", "0.2");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:unit -- --run tests/unit/parallax.test.tsx`  
Expected: FAIL because `Parallax` does not exist.

- [ ] **Step 3: Implement a static-first transform wrapper**

```tsx
"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";

export function Parallax({ children, speed, className }: { children: ReactNode; speed: number; className?: string }) {
  const clampedSpeed = Math.max(-0.2, Math.min(0.2, speed));
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, clampedSpeed * -420]);
  return <motion.div className={className} data-speed={clampedSpeed} data-testid="parallax-layer" style={reducedMotion ? undefined : { y }}>{children}</motion.div>;
}
```

Use transform-only CSS (`will-change: transform` only when enabled) and clear it under the reduced-motion media query. If the initial Motion markup is not hydration-stable, mirror the existing `Reveal` strategy and defer the Motion wrapper until hydration.

- [ ] **Step 4: Run focused checks**

Run: `npm run test:unit -- --run tests/unit/parallax.test.tsx && npm run typecheck && npm run lint`  
Expected: PASS.

- [ ] **Step 5: Commit the primitive**

```bash
git add components/exhibition/parallax.tsx tests/unit/parallax.test.tsx app/globals.css
git commit -m "feat: add bounded parallax primitive"
```

### Task 4: Compose the public exhibition camera rhythm

**Files:**
- Modify: `components/exhibition/exhibition-hero.tsx`
- Modify: `components/exhibition/life-archive-teaser.tsx`
- Modify: `components/exhibition/archive-mosaic.tsx`
- Modify: `components/exhibition/project-media.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/exhibition.spec.ts`

**Interfaces:**
- Consumes: `Parallax` and the existing image/figure components.
- Produces: hero image at `speed={-0.14}`, hero copy at `speed={0.06}`, life teaser image layers at `-0.1` / `0.08`, archive/project visual layers between `-0.08` and `0.08`; no text required for reading may be wrapped in a continuously animated layer.

- [ ] **Step 1: Add a failing semantic browser assertion for opted-in visual layers**

```ts
test("public exhibition marks visual camera layers without changing reading landmarks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("parallax-layer").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /growing/i })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByRole("region", { name: "生活影像档案" })).toBeVisible();
});
```

- [ ] **Step 2: Run the assertion and verify it fails before composition**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL because no production surface uses `Parallax` yet.

- [ ] **Step 3: Compose visual-only layers**

Wrap only the hero frame, life-archive image frames, project media figure and archive image frames with `Parallax`. Preserve every existing `figure`, `Image`, `figcaption`, heading, region label, image `sizes`, `alt`, and empty state. Assign stable class names for CSS clipping and no more than the documented speed range. Do not parallax the blog, About prose, header, footer, modal or text that the reader must track.

- [ ] **Step 4: Add responsive safety styles**

Add a desktop-only class rule that clips only media-frame overflow. Under `max-width: 760px`, remove parallax transform/will-change and retain current normal image layout. Under reduced motion, set the parallax transform to `none !important` and remove `will-change`.

- [ ] **Step 5: Run focused regression checks**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts && npm run test:unit && npm run typecheck && npm run lint`  
Expected: PASS, including mobile navigation and reduced-motion hydration tests.

- [ ] **Step 6: Commit the exhibition rhythm**

```bash
git add components/exhibition/exhibition-hero.tsx components/exhibition/life-archive-teaser.tsx components/exhibition/archive-mosaic.tsx components/exhibition/project-media.tsx app/globals.css tests/e2e/exhibition.spec.ts
git commit -m "feat: compose cinematic exhibition parallax"
```

### Task 5: Verify production behavior and document the learning outcome

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/exhibition.spec.ts`

**Interfaces:**
- Consumes: existing public routes and smooth-scroll data attribute.
- Produces: a README section named `Cinematic scroll` documenting the desktop-only Lenis enhancement, reduced-motion/mobile fallback, tuning location, and manual QA list.

- [ ] **Step 1: Add a failing route/hash regression**

```ts
test("a public hash target remains reachable with cinematic scroll enabled", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#selected-work");
  await expect(page.locator("#selected-work")).toBeInViewport();
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "enabled");
});
```

- [ ] **Step 2: Run it and verify the target or required id fails before final route wiring**

Run: `npm run test:e2e -- tests/e2e/exhibition.spec.ts`  
Expected: FAIL until `SelectedWorks` exposes `id="selected-work"` and the provider preserves the hash target.

- [ ] **Step 3: Make the smallest semantic wiring and document it**

Add `id="selected-work"` to the existing Selected Works section, not a new wrapper. Add the README section with this exact operational guidance:

```markdown
## Cinematic scroll

Desktop fine-pointer visitors receive Lenis camera-glide scrolling and bounded image-only parallax. Tune the Lenis `lerp` option in `components/exhibition/smooth-scroll-provider.tsx` and visual depth in the `speed` props passed to `Parallax`.

Touch/narrow layouts and `prefers-reduced-motion: reduce` deliberately use native scrolling with static layers. Before publishing, manually check a mouse, a trackpad, keyboard/anchor links, 390px mobile, and reduced-motion mode.
```

- [ ] **Step 4: Run the final production verification**

Run: `npm run lint && npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`  
Expected: all checks PASS; production output retains public routes and no server/client hydration warning appears in the reduced-motion browser test.

- [ ] **Step 5: Commit verification and documentation**

```bash
git add README.md components/exhibition/selected-works.tsx components/exhibition/smooth-scroll-provider.tsx tests/e2e/exhibition.spec.ts
git commit -m "test: verify cinematic scroll delivery"
```

## Plan self-review

- **Spec coverage:** Task 1 implements deterministic eligibility; Task 2 covers Lenis lifecycle, real document scrolling and native fallback; Task 3 supplies bounded reusable transforms; Task 4 maps the approved section rhythm to visual media; Task 5 covers hashes, documentation and full verification.
- **Scope:** No Locomotive, GSAP, WebGL, snap/pin/scroll lock, Studio/Auth/Supabase/RLS changes, third-party image assets or data-model changes are planned.
- **Type consistency:** `ScrollEnvironment` and `shouldEnhanceScroll` are defined before use; `SmoothScrollProvider` and `Parallax` signatures match all later tasks; `data-smooth-scroll` and `data-testid="parallax-layer"` use stable spellings throughout.
- **Placeholder scan:** No TBD/TODO/placeholder implementation steps remain. Each test and code step contains a concrete expected behavior or interface.
