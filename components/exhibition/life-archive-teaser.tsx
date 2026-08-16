import type { JSX } from "react";

import { AsymmetricalParallaxGallery } from "@/components/exhibition/asymmetrical-parallax-gallery";
import { EditorialButton } from "@/components/exhibition/editorial-button";
import { Reveal } from "@/components/exhibition/reveal";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

export function LifeArchiveTeaser({ photographs }: { photographs: PublicArchivePhotograph[] }): JSX.Element {
  return (
    <section aria-label="Life archive" className="life-archive">
      <Reveal className="life-archive-heading-wrap site-container">
        <p className="section-label">03 / LIFE ARCHIVE</p>
        <div className="life-archive-heading"><h2>生活不是边角料。</h2><p>把光线、路途和那些未被解释的瞬间，留在工作的另一面。</p></div>
      </Reveal>
      <AsymmetricalParallaxGallery photographs={photographs} />
      <div className="life-archive-action site-container"><EditorialButton href="/archive" variant="secondary">Open life archive</EditorialButton></div>
    </section>
  );
}
