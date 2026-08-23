"use client";

import type { JSX } from "react";

import { useLanguage } from "@/components/language-provider";
import { ExplorerHero } from "@/components/exhibition/explorer-hero";

export function ExhibitionHero(): JSX.Element {
  const { content } = useLanguage();

  return <ExplorerHero eyebrow={content.home.kicker} title={content.home.title} description={content.home.summary} image="/images/site-backgrounds/home-dieselpunk-harbor-v2.webp" variant="home" cta={{ href: "/projects", label: content.languageShort === "EN" ? "Explore selected work" : "探索精选作品" }} />;
}
