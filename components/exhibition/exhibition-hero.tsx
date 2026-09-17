"use client";

import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { ExplorerHero } from "@/components/exhibition/explorer-hero";

export function ExhibitionHero(): JSX.Element {
  const { content, language } = useLanguage();

  return <ExplorerHero eyebrow={content.home.kicker} title={content.home.title} description={content.home.summary} image="/images/site-backgrounds/home-dieselpunk-harbor-v2.webp" variant="home" cta={{ href: "#selected-work", label: language === "zh" ? "探索精选作品" : "Explore selected work" }} />;
}
