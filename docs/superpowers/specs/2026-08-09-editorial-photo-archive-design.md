# WhiskeyBlog editorial photo archive design

**Date:** 2026-08-09  
**Status:** Design approved in conversation; awaiting written-spec review  
**Scope:** Public Life Archive and the already protected owner-only Studio photograph editing flow.

## Intent

Turn the Life Archive into an original magazine photography archive: a warm-paper editorial composition that uses asymmetrical, diagonal-cut photographs, precise archive labels, large whitespace and gentle camera-like scroll reveal. The visual direction draws only on high-level editorial principles from the supplied reference, not its layout, content, imagery, branding or identifiable visual assets.

## Public composition

- The archive background is warm grey paper with a subtle original contour-line texture drawn in CSS/SVG. It must remain low contrast and decorative.
- Images are arranged in a responsive, non-uniform editorial collage. One selected lead image carries more scale; supporting images create the rhythm without a copied source-page composition.
- Each photo exposes a compact label containing location, captured year and optional short archive note. Visible UI labels are Simplified Chinese.
- Photo containers use the selected **B / diagonal lens cut** language. The available shapes are a small original set of diagonal polygons, not a generic animated blob library.
- Images reveal on entry by a one-time clip-path expansion combined with existing camera-glide parallax. They do not continuously morph after entering, rotate, flash, or move text needed for reading.

## Owner editing model

The existing protected Studio remains the only authoring surface. Each photograph gains editorial display metadata:

```ts
type EditorialPhotoPresentation = {
  isFeatured: boolean;
  cropX: number;        // 0–100, object-position horizontal percent
  cropY: number;        // 0–100, object-position vertical percent
  frameShape: "diagonal-left" | "diagonal-right" | "diagonal-wide";
  revealOnScroll: boolean;
};
```

- Owners may edit title, location, date, caption, display order, featured status, crop focus, frame shape and reveal preference.
- Exactly zero or one photo may be featured. If an owner marks a photo featured, the server action clears the previous featured record atomically within the owner-authorized edit path.
- Values are validated server-side: crop coordinates are finite integers from 0 to 100; shape is the declared closed set; reveal is boolean. Invalid or missing presentation values fall back to safe defaults.
- Public output must expose only presentation fields needed to render a published derivative image. It must never reveal original paths, draft data, Studio-only authorization state or owner email.

## Motion rules

- The image reveal is occasional and has the purpose of spatial consistency: it reveals the non-rectangular frame, then stops.
- Use Motion for the scroll-controlled, interruptible clip-path transform only if CSS cannot model it; animate `clip-path`, `transform` and `opacity` only.
- Entry motion uses the project motion tokens: strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` and a 650ms editorial reveal. Hover feedback is fine-pointer-only and uses a restrained transform/color transition.
- On mobile, touch-first devices and `prefers-reduced-motion: reduce`, the archive retains the diagonal static frames but disables parallax and animated clip-path movement.

## Data and migration

- Extend the existing photograph table/view/types through one additive Supabase migration. Existing published records remain valid with safe defaults.
- Update the published safe view and public adapter with only the public fields required for rendering.
- Preserve existing RLS and ownership policies. No public write path is introduced.

## Accessibility and performance

- Figures retain meaningful alt text and captions. Diagonal clipping never removes a photo from keyboard/assistive-technology reading order.
- Respect focus-visible styling, dialog behavior and reduced-transparency fallback already shipped.
- Use Next Image, existing signed derivative URLs and stable layout aspect ratios. Do not add unlicensed assets, video, canvas, WebGL or a runtime scroll listener per photo.

## Verification

- Unit tests validate presentation defaults and malformed input rejection.
- Studio/browser tests demonstrate an owner can edit shape, crop, ordering and reveal setting; non-owner access remains blocked.
- Public archive E2E proves published photographs render with editorial presentation and that draft/internal data remains absent.
- Reduced-motion/mobile E2E proves static diagonal frames stay readable without continuous animation.

## Non-goals

- No one-to-one reconstruction of the cited site, no continuous blob morphing, no feed scraping, no public photo editing, no separate CMS, and no changes to auth/RLS authorization model beyond additive display metadata support.
