import Image from "next/image";
import type { JSX } from "react";

import { EditorialButton } from "@/components/exhibition/editorial-button";
import { Reveal } from "@/components/exhibition/reveal";
import { currentFacts, homeIdentity } from "@/lib/exhibition";

export function ExhibitionHero(): JSX.Element {
  return (
    <section aria-label="Personal field notes" className="exhibition-hero site-container">
      <Reveal className="exhibition-hero-copy">
        <p className="section-label">{homeIdentity.kicker}</p>
        <h1>{homeIdentity.title}</h1>
        <p className="exhibition-summary">{homeIdentity.summary}</p>
        <EditorialButton href="/projects">Explore selected work</EditorialButton>
      </Reveal>
      <Reveal className="exhibition-hero-visual" delay={0.08}>
        <figure>
          <div className="exhibition-hero-frame">
            <Image src={homeIdentity.heroImage} alt={homeIdentity.heroAlt} fill priority sizes="(max-width: 760px) calc(100vw - 32px), 46vw" />
          </div>
          <figcaption>IMAGE PLACEHOLDER / PERSONAL WORK SCENE</figcaption>
        </figure>
        <dl className="current-facts">
          {currentFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
      </Reveal>
    </section>
  );
}
