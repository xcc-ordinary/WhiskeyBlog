# WhiskeyBlog cinematic scroll design

**Date:** 2026-08-09  
**Status:** Approved in conversation; awaiting written-spec review  
**Scope:** The public WhiskeyBlog experience only. Studio, Supabase policies, uploads, and content models are out of scope.

## Intent

Add a conspicuous but controlled camera-glide feeling inspired by the user's reference site. The result is a personal editorial exhibition, not a generic smooth-scroll demo: momentum supports project imagery and the life archive while long-form reading remains calm.

## Chosen approach

Use Lenis for global inertial scrolling and Motion scroll transforms for local parallax.

Lenis owns the interpolation between user input and the document's real scroll position. It must not put the application in a translated virtual scroll container. Motion derives per-element transforms from document scroll progress. This keeps browser history, native anchors, server rendering, keyboard navigation, and route changes reliable.

Locomotive-style virtual scrolling is explicitly excluded because its stronger scroll hijacking raises unnecessary accessibility and route-transition risk. A Motion-only local effect is excluded because it does not create the requested whole-page camera feeling.

## Interaction model

### Desktop

- Mouse-wheel and trackpad input become noticeable, smooth inertial movement. The intended perceptual range is roughly a 0.9–1.1 second eased settling response, tuned against actual interaction rather than treated as a fixed visual promise.
- Scroll remains interruptible: a new input changes momentum immediately; no scroll lock, snap, forced chapter duration, or delayed link activation is allowed.
- Header navigation, browser history, keyboard scrolling, focus scrolling, direct URLs, and hash anchors use the real document position. Hash targets must be brought into view through the smooth-scroll API when motion is enabled.

### Section rhythm

- **Home hero:** strongest scene. Its photographic layer moves slightly slower than the document while the title/content layer moves slightly faster, producing shallow editorial depth without rotation or blur.
- **Selected Works:** image groups get restrained reveal and a small progress-based vertical drift. There is no continuous theatrical effect over text labels.
- **Life Archive:** photography uses two speed bands: large compositions move slowly and smaller counterpoints move slightly faster. Transform values are bounded to prevent clipping or disorientation.
- **Project details:** a modest cover-media parallax is allowed; case-study copy and navigation remain stable for reading.
- **About and Blog:** no sustained parallax. Existing reveal behavior remains modest so long-form reading stays comfortable.

## Architecture

### `SmoothScrollProvider`

A client-only public-site provider initializes Lenis only when motion is allowed. It owns:

- animation-frame lifecycle and cleanup;
- synchronization after route and hash changes;
- preservation of native document scrolling rather than a custom scroll container;
- a public, minimal method for smooth anchor scrolling when needed.

It must never conditionally change SSR markup or introduce a hydration mismatch. The initial server/client render is static; enhancement starts after hydration.

### `Parallax`

A small client component wraps visual media only. It accepts documented props for speed/direction/range and uses Motion `useScroll`/`useTransform` to output transform values. Page components declare intent (for example, a slow hero image) rather than attach independent scroll listeners.

Only `transform` and `opacity` may animate continuously. It must avoid layout-changing properties, continuous large CPU work outside view, and animation on semantic text necessary for reading.

## Accessibility and fallbacks

- `prefers-reduced-motion: reduce` disables Lenis and all parallax transforms. The site uses native scrolling with static visual layers.
- Touch-first and narrow/mobile layouts disable Lenis and continuous parallax. Mobile remains a natural browser scroll experience.
- Keyboard, assistive-technology focus changes, skip links, dialogs, and anchor links must work without requiring hover or wheel input.
- Existing reduced-transparency and focus-visible behavior remains in force.

## Performance safeguards

- Lenis starts only on eligible desktop pointer environments after hydration.
- Parallax is limited to explicitly opted-in image layers and bounded transform ranges.
- Images continue to use Next Image sizing/lazy loading. No new third-party imagery is introduced.
- Do not use a global `scroll` handler per component, scroll-jacking containers, or per-frame layout measurements across arbitrary nodes.

## Verification

- Unit tests cover the motion-eligibility decision and stable public component interfaces.
- Browser tests verify desktop enhancement loads without hydration/recoverable errors, hash/navigation behavior remains reachable, and existing mobile navigation still works.
- Browser tests emulate reduced motion and mobile viewport to verify inertial enhancement is disabled and no continuous transform is required for content access.
- Manual acceptance covers mouse wheel, trackpad interruption, anchor navigation, desktop hero depth, archive depth, mobile native feel, and reduced-motion stillness.

## Non-goals

- No full-screen scroll snapping, pinned chapters, scroll-lock timelines, canvas/WebGL scenes, GSAP migration, Locomotive Scroll, or changes to Studio/Supabase/RLS.
- No external copyrighted image assets or imitation of the reference site's branding.
