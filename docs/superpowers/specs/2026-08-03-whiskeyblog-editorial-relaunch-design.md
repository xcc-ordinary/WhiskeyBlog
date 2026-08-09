# WhiskeyBlog Editorial Relaunch — Design Specification

**Status:** Approved visual direction pending written-spec review  
**Date:** 2026-08-03  
**Owner:** WhiskeyBlog

## 1. Purpose and point of view

WhiskeyBlog becomes a personal digital exhibition for a **developer growing in public**. It is not a résumé, a generic portfolio, or a social-media grid. Every area answers one of three questions:

1. What am I becoming?
2. What have I built to prove it?
3. What gives the work a real human context?

The feeling is quiet confidence with selective energy: warm white space, charcoal type, real photography, irregular editorial composition, and one restrained vermilion accent.

## 2. Reference translation

The Landon Norris reference contributes chapter-based storytelling, oversized typography, image-led pacing, numbered metadata, and moments of visual energy. WhiskeyBlog must **not** copy its racing brand, neon palette, lock-to-scroll behavior, or visual density.

Apple design principles shape interaction:

- controls respond immediately on press;
- interactive motion uses critically damped springs and can be interrupted;
- navigation and drawers preserve spatial continuity;
- reduced-motion users receive short opacity transitions, never parallax or spring travel;
- translucent material is reserved for fixed navigation and modal surfaces.

## 3. Design system

### Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#FAF9F6` | primary warm-white canvas |
| Paper-muted | `#F0EEE8` | editorial section shift |
| Ink | `#1B1C1E` | titles, primary controls, dark archive section |
| Graphite | `#5B5C58` | body text |
| Rule | `#E2DFD7` | hairlines and quiet separators |
| Steel | `#91A9A7` | occasional image/metadata balance |
| Vermilion | `#E05F48` | numbered labels, active marker, small button detail only |

Vermilion may not fill a hero background, decorate cards, or appear in multiple competing locations. Images provide the primary visual color.

### Typography

- UI and body: platform system stack (`-apple-system`, `BlinkMacSystemFont`, `PingFang SC`, `Microsoft YaHei`, sans-serif) for native Chinese and Apple-like optical behavior.
- Display: same stack at `font-weight: 600–650`, `letter-spacing: -0.07em to -0.095em`, line-height `0.78–0.92`.
- Occasional editorial emphasis: an installed serif fallback (`Iowan Old Style`, `Baskerville`, `Georgia`) in italic only; never for Chinese body copy.
- Body copy: 16–18px desktop, 15–16px mobile, 1.55–1.7 line-height; long-form width 660–720px.

### Materials and controls

- Header: warm translucent material with blur only while content scrolls behind it.
- Primary action: ink pill, 999px radius, a vermilion circular arrow detail, immediate `scale(.972)` press response, critically damped 0.35–0.4s hover/return.
- Secondary action: text link with a hairline underline that changes to vermilion; arrow travels 2–4px.
- No floating gradients, glass-card stacks, generic shadows, or rounded card collections.

## 4. Information architecture

### Home — a six-chapter exhibition

1. **Personal Field Notes / Hero:** `GROWING with every BUILD.` with short Chinese identity statement, one naturally lit portrait/photo, and `Explore selected work`.
2. **Selected Work:** three featured projects in asymmetric image-led scale. A project is a case study, not a card.
3. **Life Archive:** a freer photography cadence that makes life feel present between projects.
4. **About:** short narrative, current focus, location, and working values; no conventional résumé.
5. **Notes in Progress:** indexed blog directory with category and date; selected Xiaohongshu preview is an honest external handoff.
6. **Contact:** one strong closing sentence, email, Xiaohongshu, GitHub, and copyright.

### Routes

- `/` exhibition home
- `/projects` and `/projects/[slug]` selected work and case study
- `/archive` published photography archive
- `/about` longer personal field notes
- `/blog`, `/blog/[slug]` indexed notes and long-form reading
- `/studio` protected owner media workflow (existing; visually aligned but remains utility-first)

## 5. Component map

- `EditorialHeader`: fixed translucent navigation, desktop links, accessible mobile sheet.
- `ExhibitionHero`: staggered type, portrait/image, caption, primary/secondary action.
- `SectionLabel`: chapter number plus uppercase descriptor.
- `SelectedWorksGallery`: asymmetric media-led project entries and accessible link overlays.
- `LifeArchiveTeaser`: independently paced photo composition linking to `/archive`.
- `AboutFieldNotes`: portrait, short prose, three current facts.
- `NotesDirectory`: numbered entries, filtering, editorial hover feedback.
- `XiaohongshuHandoff`: selected original previews plus a clearly external profile link; no imitation of Xiaohongshu UI.
- `EditorialFooter`: high-memory closing field with contact links.

Content stays data-driven: project, post and photograph data are not authored inside page components. Existing MDX and Supabase published-photo boundaries remain the sources of truth.

## 6. Layout and responsive behavior

Desktop uses a 12-column fluid container, 5–8vw horizontal breathing room, and intentional offsets. The hero photo overlaps the reading field without obscuring text. Project images use a 1.25:0.75 split followed by an offset medium work. Archive images vary in height.

Tablet preserves hierarchy but reduces offsets and image overlap. Mobile becomes a clear vertical story: fixed header, compact display type, hero image after the introduction, project entries one per row, and archive mosaic in two columns. Mobile navigation opens as a semantic dialog/sheet. The site must remain complete without hover.

## 7. Motion timeline

| Moment | Frame sequence | Implementation boundary |
| --- | --- | --- |
| Page entry | label fades → title rises 12px → image settles from 1.03 scale | 90ms stagger, 420ms max; opacity/transform only |
| Scroll reveal | image clip/opacity reveal, then caption | once per section; no scroll locking |
| Project hover | image scale/crop shifts 2–3%, arrow moves 3px | pointer-capable devices only |
| Primary press | press scale begins immediately, release returns via spring | Motion spring, no overshoot by default |
| Navigation/sheet | opens from trigger position; closes along reverse path | focus moved/restored, Escape supported |

`prefers-reduced-motion: reduce` removes all parallax, scaling travel and stagger; retain only a 160–200ms opacity transition. Do not make automatic looping animation.

## 8. Accessibility and performance

- Semantic landmarks, one H1 per page, real buttons/links, visible focus states, and keyboard-reachable project/gallery interactions.
- Every published photograph needs meaningful alternative text. Original images never reach public clients.
- Use `next/image`, responsive `sizes`, lazy loading below the fold, and signed derivative URLs from the existing public-photo boundary.
- Honor `prefers-reduced-motion`, `prefers-reduced-transparency`, and high-contrast preferences.
- Target strong color contrast; vermilion is never the only way to communicate a state.

## 9. Personal replacements required

Before launch replace or supply:

1. Personal name (currently the brand is `WhiskeyBlog`).
2. Hero portrait / representative natural photograph.
3. One-sentence Chinese identity statement and optional English display line.
4. Three projects: title, year, role, type, short description, cover and case-study media.
5. Life Archive photos with title, alt text, date, location, category, and derived image variants.
6. About prose, current focus, location, working values, and natural portrait.
7. Blog posts/categories plus the real Xiaohongshu profile URL and selected note links.
8. GitHub and any additional social/portfolio URLs.

## 10. Learning path

1. Build the design tokens and type scale; inspect why tracking changes at display sizes.
2. Construct the hero with semantic HTML before adding motion.
3. Learn image aspect ratios and responsive `next/image` through the gallery.
4. Add Motion reveals and press feedback; test with reduced motion enabled.
5. Connect published photographs, then replace placeholders with your own media.
6. Test keyboard flow, narrow screens, performance, and real content density.

## 11. Scope boundary

This redesign does not add automatic derivative generation, a Xiaohongshu API integration, social-feed scraping, a new CMS, or scroll-jacking. Those can be designed separately after the exhibition experience is functioning with real content.
