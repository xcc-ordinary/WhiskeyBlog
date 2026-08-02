# Digital Exhibition Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Transform the current personal site into a responsive editorial digital exhibition with a refined home page, works gallery and work detail pages.

**Architecture:** Keep content server-side and typed. Add a small exhibition data layer that turns project MDX metadata into gallery records; route components compose editorial primitives rather than hard-code visual content.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, MDX, Framer Motion, Vitest, Playwright.

## Global Constraints

- Use warm white, charcoal, gray and one muted brick-red accent; no gradients, heavy shadows or SaaS card styling.
- Use only local owner-provided images or clearly labelled local replacement panels.
- Keep desktop composition intentional and reflow to a vertical mobile narrative.
- Support keyboard navigation, visible focus and prefers-reduced-motion.
- Preserve existing MDX routes, tests and static build behavior.

## Task 1: Establish the exhibition design system

Files: create lib/exhibition.ts, editorial components and tests/unit/exhibition.test.ts; modify app/globals.css.

- [ ] Write a failing unit test: first work is numbered 01 and WhiskeyBlog has Learning Lab as next work.
- [ ] Implement WorkRecord, toWorkRecord and getAdjacentWorks with visual variants portrait, landscape and square.
- [ ] Add semantic Eyebrow and SectionHeading components plus paper, ink, muted, rule and accent design tokens.
- [ ] Run npm run test:unit, npm run lint and npm run typecheck.
- [ ] Commit with message: feat: add exhibition design system.

## Task 2: Build the selected-works gallery

Files: create components/works/work-tile.tsx, work-gallery.tsx and components/motion/reveal.tsx; modify app/projects/page.tsx, app/globals.css and card tests.

- [ ] Extend a card test to expect work number, year, type and project link.
- [ ] Implement a varied 12-column desktop grid that becomes one column on small screens.
- [ ] Render a labelled local replacement panel for each missing project cover; never use unlicensed external images.
- [ ] Add reduced-motion-safe opacity and clip-path reveal behavior.
- [ ] Run unit tests, lint and typecheck.
- [ ] Commit with message: feat: add selected works gallery.

## Task 3: Recompose home and work details

Files: modify app/page.tsx and app/projects/[slug]/page.tsx; create work-hero.tsx and work-navigator.tsx.

- [ ] Add a failing test for absent previous work and present next work.
- [ ] Rebuild home as identity hero, visual replacement panel, selected works and latest journal section.
- [ ] Rebuild work pages as cover, background, role, process, result and adjacent-work navigation.
- [ ] Validate home, gallery, detail page and 404 behavior in a production build.
- [ ] Commit with message: feat: compose exhibition home and work details.

## Task 4: Verify the exhibition and document media replacement

Files: create tests/e2e/exhibition.spec.ts; modify README.md and tests/e2e/smoke.spec.ts.

- [ ] Add a browser test that opens the works gallery, enters the first numbered work and tabs to adjacent-work navigation.
- [ ] Document replacement assets: hero portrait, work covers, detail images, life archive media, name, bio and social links.
- [ ] Run npm run test:unit, npm run test:e2e, npm run lint, npm run typecheck and npm run build.
- [ ] Commit with message: test: verify digital exhibition flow.

## Scope boundary

This phase establishes the visual and component foundation only. Life Archive, About expansion, Journal filtering and Xiaohongshu previews are follow-up phases built on the same content system.
