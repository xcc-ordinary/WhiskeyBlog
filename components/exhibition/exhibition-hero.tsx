"use client";

import Image from "next/image";
import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { EditorialButton } from "@/components/exhibition/editorial-button";
import { Parallax } from "@/components/exhibition/parallax";
import { Reveal } from "@/components/exhibition/reveal";
import { homeIdentity } from "@/lib/exhibition";

export function ExhibitionHero(): JSX.Element {
  const { content } = useLanguage();

  return (
    <section aria-label="Personal field notes" className="exhibition-hero site-container">
      <Reveal className="exhibition-hero-copy">
        <p className="section-label">{content.home.kicker}</p>
        <h1 className="font-serif tracking-wide font-bold">{content.home.title}</h1>
        <p className="hero-quote-author">{content.home.titleAuthor}</p>
        <p className="exhibition-summary">{content.home.summary}</p>
        <EditorialButton href="/projects">{content.languageShort === "EN" ? "探索精选作品" : "Explore selected work"}</EditorialButton>
      </Reveal>
      <Reveal className="exhibition-hero-visual" delay={0.08}>
        <figure className="hero-glass-card hero-work-scene">
          <div className="exhibition-hero-frame">
            <Parallax className="visual-camera-layer" speed={-0.14}>
              <Image src={homeIdentity.heroImage} alt={homeIdentity.heroAlt} fill priority sizes="(max-width: 760px) calc(100vw - 32px), 32vw" />
            </Parallax>
          </div>
          <figcaption>PERSONAL WORK SCENE</figcaption>
        </figure>
        <dl className="current-facts hero-glass-card">
          {content.home.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
      </Reveal>
    </section>
  );
}
