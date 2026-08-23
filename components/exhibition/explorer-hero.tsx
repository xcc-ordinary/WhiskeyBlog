"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type JSX, type ReactNode } from "react";

import { useScrollEnhancement } from "@/components/exhibition/use-scroll-enhancement";

type ExplorerHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  variant?: "default" | "home";
  cta?: { href: string; label: string };
  children?: ReactNode;
};

export function ExplorerHero({ eyebrow, title, description, image, variant = "default", cta, children }: ExplorerHeroProps): JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const motionEnabled = useScrollEnhancement();

  useLayoutEffect(() => {
    if (!motionEnabled || !rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const panel = gsap.utils.selector(rootRef)(".explorer-hero-panel");

      gsap.fromTo(panel, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" });
      gsap.to(panel, { yPercent: -5, ease: "none", scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: 1 } });
    }, rootRef);

    return () => context.revert();
  }, [motionEnabled]);

  return (
    <section className={`explorer-hero explorer-hero--${variant}`} ref={rootRef} aria-label={title}>
      <div aria-hidden="true" className="explorer-hero-background parallax-layer" data-testid="parallax-layer" style={{ backgroundImage: `url(${image})` }} />
      <div className="explorer-hero-vignette" aria-hidden="true" />
      <div className="explorer-hero-panel explorer-glass">
        <p className="explorer-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="explorer-description">{description}</p>
        {children}
        {cta ? <Link className="explorer-link" href={cta.href}>{cta.label}<span aria-hidden="true">↗</span></Link> : null}
      </div>
      <p className="explorer-scroll-note">LOG ENTRY / 2026</p>
    </section>
  );
}
