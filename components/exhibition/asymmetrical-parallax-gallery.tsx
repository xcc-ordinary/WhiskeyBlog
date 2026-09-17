"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { useScrollEnhancement } from "@/components/exhibition/use-scroll-enhancement";
import { useLanguage } from "@/components/language-provider";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

import styles from "./asymmetrical-parallax-gallery.module.css";

const galleryLayouts = [
  { className: "horizontal-gallery-piece-primary", aspect: "landscape" },
  { className: "horizontal-gallery-piece-portrait", aspect: "portrait" },
  { className: "horizontal-gallery-piece-square", aspect: "square" },
  { className: "horizontal-gallery-piece-detail", aspect: "detail" },
] as const;

export function AsymmetricalParallaxGallery({ photographs }: { photographs: PublicArchivePhotograph[] }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<HTMLDivElement>(null);
  const motionEnabled = useScrollEnhancement();
  const { content } = useLanguage();
  const copy = content.home.gallery;
  const items = galleryLayouts.map((layout, index) => ({ layout, photograph: photographs[index] ?? null }));

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const pinned = pinnedRef.current;
    const track = trackRef.current;
    const panorama = panoramaRef.current;
    if (!motionEnabled || !wrapper || !pinned || !track || !panorama) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const panoramaDistance = () => Math.max(0, panorama.scrollWidth - window.innerWidth);
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          pin: pinned,
          scrub: 0.6,
          start: "top top",
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          fastScrollEnd: true,
        },
      });

      timeline
        .to(track, { x: () => -distance(), ease: "none", force3D: true }, 0)
        .to(panorama, { x: () => -panoramaDistance(), ease: "none", force3D: true }, 0);

      if (distance() === 0) timeline.scrollTrigger?.kill();
      ScrollTrigger.refresh();
    }, wrapper);

    return () => context.revert();
  }, [motionEnabled, photographs.length]);

  return (
    <section aria-label={copy.ariaLabel} className={`gallery-wrapper ${styles.harborGallery}`} ref={wrapperRef}>
      <div className={`gallery-pinned ${styles.pinned}`} ref={pinnedRef}>
        <div aria-hidden="true" className={styles.panorama} ref={panoramaRef} />
        <div aria-hidden="true" className={styles.panoramaWash} />
        <div className="gallery-track" ref={trackRef}>
          <div className="horizontal-gallery-intro">
            <span>{copy.kicker}</span>
          </div>
          {items.slice(0, 2).map(({ layout, photograph }, index) => <GalleryPiece copy={copy} index={index} key={photograph?.id ?? `gallery-placeholder-${index}`} layout={layout} photograph={photograph} />)}
          <article className="horizontal-gallery-quote">
            <p>“{copy.quote}”</p>
            <span>{copy.quoteLabel}</span>
          </article>
          {items.slice(2).map(({ layout, photograph }, index) => <GalleryPiece copy={copy} index={index + 2} key={photograph?.id ?? `gallery-placeholder-${index + 2}`} layout={layout} photograph={photograph} />)}
          <p className="horizontal-gallery-end">{copy.ending}</p>
        </div>
      </div>
    </section>
  );
}

function GalleryPiece({ copy, index, layout, photograph }: { copy: { placeholder: string; privateArchive: string; published: string }; index: number; layout: (typeof galleryLayouts)[number]; photograph: PublicArchivePhotograph | null }) {
  return (
    <article className={`horizontal-gallery-piece gallery-item ${layout.className}`}>
      <figure className={`horizontal-gallery-frame horizontal-gallery-frame-${layout.aspect}`}>
        {photograph ? <Image alt={photograph.alt} fill sizes="(max-width: 768px) 92vw, 780px" src={photograph.galleryUrl} unoptimized /> : <div aria-hidden="true" className="horizontal-gallery-placeholder">PHOTO / {String(index + 1).padStart(2, "0")}</div>}
      </figure>
      <div className="horizontal-gallery-caption"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{photograph?.title ?? copy.placeholder}</h3><p>{photograph ? ([photograph.location, photograph.capturedAt?.slice(0, 4)].filter(Boolean).join(" · ") || copy.published) : copy.privateArchive}</p></div></div>
    </article>
  );
}
