# Owner Media Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a protected owner-only Studio for uploading, curating and publishing photographs to the digital exhibition.

**Architecture:** Supabase Auth authenticates an allowlisted owner; private Storage holds originals; Postgres stores Photograph metadata and publication state. Next.js server routes perform authorization and return only published records to public pages.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth, Supabase Storage, Supabase Postgres, Vitest, Playwright.

## Global Constraints

- Only the allowlisted owner may access Studio routes or mutate media.
- Original files remain private; public pages receive only published derivatives.
- Publication is an explicit action after metadata is supplied.
- Service-role credentials are server-only; public environment values contain no secret.
- All public photos require useful alternative text and responsive delivery.

## Task 1: Provision Supabase and define the database boundary

Files: create supabase/migrations/0001_photographs.sql and lib/supabase/types.ts; modify .env.example and README.md.

- [ ] Create a Supabase project and configure the owner email in Auth redirect settings.
- [ ] Create private buckets originals and derivatives.
- [ ] Apply a photographs table migration with id, original_path, thumbnail_path, gallery_path, detail_path, title, alt, caption, captured_at, location, category, display_order, crop, status, created_at and published_at.
- [ ] Add row-level security: authenticated owner may select/insert/update/delete; anonymous users select only rows whose status is published.
- [ ] Add documented environment names NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
- [ ] Commit with message: chore: define media studio storage schema.

## Task 2: Add typed server access and owner authorization

Files: create lib/supabase/client.ts, server.ts, auth.ts and photographs.ts; create tests/unit/photographs.test.ts.

- [ ] Write a failing test for public query filtering to published status and owner-only mutation guards.
- [ ] Install Supabase JavaScript client and server-side cookie helpers.
- [ ] Implement getPublishedPhotographs, getOwnerPhotographs, createDraftPhotograph, updatePhotograph and publishPhotograph.
- [ ] Implement requireOwner that rejects unauthenticated and non-allowlisted requests.
- [ ] Run unit tests, lint and typecheck.
- [ ] Commit with message: feat: add protected photograph data access.

## Task 3: Build sign-in and Studio library

Files: create app/studio/page.tsx, app/studio/login/page.tsx, app/studio/actions.ts, components/studio/sign-in-form.tsx and photograph-library.tsx.

- [ ] Write a browser test that unauthenticated access to Studio reaches sign-in.
- [ ] Implement magic-link request form and sign-out action.
- [ ] Implement Studio library with draft and published tabs, status labels and empty states.
- [ ] Add an accessible owner-only navigation entry visible only after authorization.
- [ ] Run unit tests, browser tests, lint and typecheck.
- [ ] Commit with message: feat: add owner media studio library.

## Task 4: Build draft upload, metadata editing and publish flow

Files: create components/studio/upload-drawer.tsx, photograph-editor.tsx and app/studio/[id]/page.tsx.

- [ ] Write a failing test for a draft that cannot publish without title and alternative text.
- [ ] Implement signed upload URL creation, client upload progress and a recoverable failure message.
- [ ] Implement metadata editor for title, alt, date, location, category, caption, display order and crop.
- [ ] Implement save-draft, publish and unpublish actions with server authorization.
- [ ] Run unit tests, browser tests, lint, typecheck and build.
- [ ] Commit with message: feat: add draft photograph publishing flow.

## Task 5: Surface published media safely

Files: create lib/public-photographs.ts and app/archive/page.tsx; modify README.md and tests/e2e.

- [ ] Write a browser test that published media appears in Archive and drafts do not.
- [ ] Render responsive public derivatives through next/image with alternative text, lazy loading and editorial metadata.
- [ ] Document exact personal replacements and the Supabase deployment environment setup.
- [ ] Run full unit tests, browser tests, lint, typecheck and production build.
- [ ] Commit with message: feat: display published photography archive.

## Scope boundary

Automatic derivative generation, bulk upload, archival lightbox, work-photo attachment and Xiaohongshu synchronization require separate designs after the secure owner workflow is complete.
