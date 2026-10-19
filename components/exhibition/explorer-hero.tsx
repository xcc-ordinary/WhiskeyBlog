"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { useLayoutEffect, useRef, type JSX, type ReactNode } from "react";

import { useScrollEnhancement } from "@/components/exhibition/use-scroll-enhancement";

type ExplorerHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant?: "default" | "home";
  cta?: { href: string; label: string };
  children?: ReactNode;
};

export function ExplorerHero({ eyebrow, title, description, variant = "default", cta, children }: ExplorerHeroProps): JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const motionEnabled = useScrollEnhancement();
  useLayoutEffect(() => {
    if (!motionEnabled || !rootRef.current) return;

    const context = gsap.context(() => {
      const panel = gsap.utils.selector(rootRef)(".explorer-hero-panel");

      gsap.fromTo(panel, { autoAlpha: 0.2, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" });
    }, rootRef);

    return () => context.revert();
  }, [motionEnabled]);

  return (
    <section className={`explorer-hero explorer-hero--${variant} coastal-explorer`} ref={rootRef} aria-label={title}>
      <div className="explorer-hero-panel">
        <p className="explorer-kicker">{eyebrow}</p>
        <h1>{variant === "home" && title.includes("，") ? <>{title.slice(0, title.indexOf("，") + 1)}<br />{title.slice(title.indexOf("，") + 1)}</> : title}</h1>
        <p className="explorer-description">{description}</p>
        {children}
        {cta ? <Link className="explorer-link" href={cta.href}>{cta.label}<span aria-hidden="true">↗</span></Link> : null}
      </div>
      <p className="explorer-scroll-note">WHISKEY / FIELD NOTES</p>
    </section>
  );
}
