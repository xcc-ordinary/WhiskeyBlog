"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { useScrollEnhancement } from "@/components/exhibition/use-scroll-enhancement";
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
  const motionEnabled = useScrollEnhancement();
  const items = galleryLayouts.map((layout, index) => ({ layout, photograph: photographs[index] ?? null }));

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const pinned = pinnedRef.current;
    const track = trackRef.current;
    if (!motionEnabled || !wrapper || !pinned || !track) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          pin: pinned,
          scrub: 1.5,
          start: "top top",
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      const galleryItems = gsap.utils.toArray<HTMLElement>(".gallery-item");
      galleryItems.forEach((item, index) => {
        const drift = index % 2 === 0 ? 22 : -22;
        gsap.fromTo(item, { y: drift, scale: 1.05 }, {
          y: -drift,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: item,
            containerAnimation: tween,
            start: "left 85%",
            end: "right 15%",
            scrub: 1.5,
          },
        });
      });

      if (distance() === 0) tween.scrollTrigger?.kill();
      ScrollTrigger.refresh();
    }, wrapper);

    return () => context.revert();
  }, [motionEnabled, photographs.length]);

  return (
    <section aria-label="横向滚动摄影画廊" className={`gallery-wrapper ${styles.harborGallery}`} ref={wrapperRef}>
      <div className={`gallery-pinned ${styles.pinned}`} ref={pinnedRef}>
        <div className="gallery-track" ref={trackRef}>
          <div className="horizontal-gallery-intro">
            <span>FIELD NOTES / 2026</span>
            <span>SCROLL TO MOVE →</span>
          </div>
          {items.slice(0, 2).map(({ layout, photograph }, index) => <GalleryPiece index={index} key={photograph?.id ?? `gallery-placeholder-${index}`} layout={layout} photograph={photograph} />)}
          <article className="horizontal-gallery-quote">
            <p>“The moments between<br />the plans are the ones<br />that stay with us.”</p>
            <span>PRIVATE OBSERVATIONS</span>
          </article>
          {items.slice(2).map(({ layout, photograph }, index) => <GalleryPiece index={index + 2} key={photograph?.id ?? `gallery-placeholder-${index + 2}`} layout={layout} photograph={photograph} />)}
          <p className="horizontal-gallery-end">EVERYDAY, HELD LIGHTLY</p>
        </div>
      </div>
    </section>
  );
}

function GalleryPiece({ index, layout, photograph }: { index: number; layout: (typeof galleryLayouts)[number]; photograph: PublicArchivePhotograph | null }) {
  return (
    <article className={`horizontal-gallery-piece gallery-item ${layout.className}`}>
      <figure className={`horizontal-gallery-frame horizontal-gallery-frame-${layout.aspect}`}>
        {photograph ? <Image alt={photograph.alt} fill sizes="(max-width: 768px) 92vw, 780px" src={photograph.galleryUrl} unoptimized /> : <div aria-hidden="true" className="horizontal-gallery-placeholder">PHOTO / {String(index + 1).padStart(2, "0")}</div>}
      </figure>
      <div className="horizontal-gallery-caption"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{photograph?.title ?? "A moment waiting to surface"}</h3><p>{photograph ? ([photograph.location, photograph.capturedAt?.slice(0, 4)].filter(Boolean).join(" · ") || "Published photograph") : "Private archive"}</p></div></div>
    </article>
  );
}
