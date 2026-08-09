# Editorial Photo Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Let the owner curate published photographs as an original diagonal-cut magazine archive with safe public rendering and static fallbacks.

**Architecture:** Add validated presentation metadata to the existing photograph row/types and owner-only actions. The public safe view/adapter returns only published derivative presentation data; `ArchiveMosaic` uses a small diagonal frame component and the already built scroll primitives for optional one-time reveal.

**Tech Stack:** Next.js, React, TypeScript, Supabase SQL/RLS, Motion, Lenis, Vitest, Playwright.

## Global Constraints

- No reproduction of the cited website's layout, assets, copy, branding, or source code.
- `frameShape` is exactly `diagonal-left | diagonal-right | diagonal-wide`; `cropX`/`cropY` are integers 0–100; `revealOnScroll` is boolean.
- Only an authorized owner may edit presentation metadata. Public output exposes derivative URLs and presentation data only—never `originalPath`, drafts, owner email or authorization state.
- Exactly zero or one featured photo; setting one featured clears the previous one in the owner action.
- On mobile/touch/reduced motion, diagonal frames remain static; no Lenis/parallax/animated clip-path is required for access.

---

### Task 1: Add validated presentation metadata to published photographs

**Files:** Modify `supabase/migrations/0001_photographs.sql` only through a new migration `0003_editorial_photo_presentation.sql`; modify `lib/supabase/types.ts`, `lib/supabase/photographs.ts`, `lib/public-photographs.ts`; modify `tests/unit/photographs.test.ts`, `tests/unit/public-photographs.test.ts`.

**Interfaces:** produce `EditorialPhotoPresentation` and add `presentation` to `PublicArchivePhotograph` with `featured`, `cropX`, `cropY`, `frameShape`, `revealOnScroll`.

- [ ] Write failing tests that accept valid defaults, reject `cropX: 101`, reject an unknown shape, and prove public results have presentation but no `originalPath`.
- [ ] Run `npm run test:unit -- --run tests/unit/photographs.test.ts tests/unit/public-photographs.test.ts`; expect RED for missing presentation contract.
- [ ] Add migration defaults/check constraints and extend the existing published safe view; normalize missing legacy values to `{ featured:false, cropX:50, cropY:50, frameShape:"diagonal-left", revealOnScroll:true }` in the public adapter before derivative signing.
- [ ] Run the focused tests, `npm run typecheck`, and `npm run lint`; expect PASS.
- [ ] Commit `feat: add editorial photo presentation data`.

### Task 2: Add owner-only archive editing controls

**Files:** Modify `app/studio/actions.ts`, `components/studio/photograph-editor.tsx`, `components/studio/photograph-library.tsx`, `lib/supabase/photographs.ts`; modify/add unit and Studio E2E tests.

**Interfaces:** produce `updateEditorialPhotoPresentation(input: { id:string; cropX:number; cropY:number; frameShape:FrameShape; revealOnScroll:boolean; isFeatured:boolean }): Promise<void>` inside the existing owner action boundary.

- [ ] Write a failing unit/action test asserting a non-owner is rejected and a second featured update clears the first.
- [ ] Run the focused test; expect RED for absent action.
- [ ] Implement server-side schema validation, transaction-safe featured clearing, and Studio controls for crop focus, shape, reveal, feature and order. Keep all controls inside the authenticated owner editor; do not create public mutation routes.
- [ ] Add a Studio E2E assertion that unauthenticated access stays at sign-in and owner presentation controls are labelled in Chinese.
- [ ] Run focused tests, `npm run typecheck`, and `npm run lint`; expect PASS.
- [ ] Commit `feat: add archive presentation editor`.

### Task 3: Compose the original magazine archive and verify fallbacks

**Files:** Create `components/exhibition/editorial-photo-frame.tsx`; modify `components/exhibition/archive-mosaic.tsx`, `components/exhibition/life-archive-teaser.tsx`, `app/globals.css`, `tests/e2e/archive.spec.ts`, `tests/e2e/exhibition.spec.ts`, `README.md`.

**Interfaces:** `EditorialPhotoFrame({ photo, priority }: { photo: PublicArchivePhotograph; priority?: boolean })` applies exactly one of the declared diagonal frame classes, Next Image object-position from safe crop percents, and optional visual-only reveal.

- [ ] Write a failing Archive E2E check for `data-frame-shape="diagonal-wide"`, published caption visibility, and absence of draft metadata.
- [ ] Run the Archive test; expect RED before the frame component is used.
- [ ] Implement an original asymmetrical archive layout with one optional featured photo, location/year captions and low-contrast original contour texture. Use `clip-path` on static diagonal shapes; animate one-time reveal only on eligible desktop motion, with `clip-path`, `transform`, `opacity`, 650ms `cubic-bezier(0.23,1,0.32,1)`. Never continuously morph after reveal.
- [ ] Add CSS mobile/reduced-motion rules that preserve frame shapes while disabling transform/animated clipping and hover motion.
- [ ] Document owner-editable fields and manual QA in README.
- [ ] Run `npm run lint && npm run typecheck && npm run test:unit && npm run test:e2e && npm run build`; expect PASS.
- [ ] Commit `feat: compose editorial photo archive`.

## Plan self-review

- Task 1 covers additive storage, safe public output and legacy defaults.
- Task 2 covers protected authoring and exclusive featured selection.
- Task 3 covers original public composition, motion fallback and production verification.
- No task changes RLS authorization semantics, publishes originals, or reproduces the supplied reference.
