"use client";

import Link from "next/link";
import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { Parallax } from "@/components/exhibition/parallax";
import { Reveal } from "@/components/exhibition/reveal";

export function ExhibitionHero(): JSX.Element {
  const { content } = useLanguage();

  return (
    <section aria-label="Personal field notes" className="concept-hero">
      <Parallax className="concept-hero-atmosphere" speed={-0.04}><span aria-hidden="true" /></Parallax>
      <Reveal className="concept-hero-content">
        <p className="concept-hero-kicker">{content.home.kicker}</p>
        <h1>{content.home.title}</h1>
        <p className="concept-hero-author">{content.home.titleAuthor}</p>
        <p className="concept-hero-summary">{content.home.summary}</p>
        <Link className="concept-hero-link" href="/projects">
          {content.languageShort === "EN" ? "Explore selected work" : "探索精选作品"}
          <span aria-hidden="true">↘</span>
        </Link>
      </Reveal>
      <p className="concept-hero-index">SCROLL TO ENTER / 2026</p>
    </section>
  );
}
