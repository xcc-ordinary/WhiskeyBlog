# Owner Media Studio Design

## Purpose

Media Studio is an owner-only workspace at /studio for turning private photography into curated public material for the digital exhibition. Visitors never upload or manage media.

## Access and security

Supabase Auth uses an allowlisted owner email and passwordless magic-link sign-in. Every Studio route verifies the authenticated owner on the server. The Storage bucket for originals is private; browser upload access uses short-lived signed URLs. Service-role credentials are server-only and never reach the browser.

## Publishing workflow

1. The owner selects one or more images in Studio.
2. The browser requests a signed upload URL and writes the original into private storage.
3. A Photograph Draft is created with status draft.
4. The owner adds title, alt text, capture date, location, category, caption, display order and crop preference.
5. Server processing creates optimized thumbnail, gallery and detail derivatives.
6. The owner previews and explicitly publishes the photograph.
7. Only Published Photographs are returned by public archive and work queries.

## Data model

Photograph fields are id, originalPath, thumbnailPath, galleryPath, detailPath, title, alt, caption, capturedAt, location, category, displayOrder, crop, status, createdAt and publishedAt. Status is either draft or published. A photograph may later be attached to one work, but phase one keeps the relationship optional.

## Studio interface

- Sign-in: single email form that requests a magic link.
- Library: tabs for draft and published photographs, searchable metadata, status labels and a new-upload button.
- Upload drawer: file selection, upload progress and recoverable error state.
- Editor: responsive preview, metadata form, delete action, save-draft action and publish/unpublish action.
- Publishing is an explicit final action, never an upload side effect.

## Public image delivery

The public website reads gallery and detail derivatives only. All public images use next/image with descriptive alt text, responsive sizes and lazy loading below the fold. Originals remain private. Empty media slots stay as labelled local replacement panels until published assets exist.

## Boundaries

This phase creates the secure media foundation and Studio. Public Life Archive masonry, lightbox browsing, work-media attachments, bulk upload and external Xiaohongshu import are later features.
