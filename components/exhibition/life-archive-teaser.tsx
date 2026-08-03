import Image from "next/image";
import type { JSX } from "react";

import { EditorialButton } from "@/components/exhibition/editorial-button";
import { Reveal } from "@/components/exhibition/reveal";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

export function LifeArchiveTeaser({ photographs }: { photographs: PublicArchivePhotograph[] }): JSX.Element {
  return (
    <section aria-label="Life archive" className="life-archive site-container">
      <Reveal>
        <p className="section-label">03 / LIFE ARCHIVE</p>
        <div className="life-archive-heading"><h2>生活不是边角料。</h2><p>把光线、路途和那些未被解释的瞬间，留在工作的另一面。</p></div>
      </Reveal>
      {photographs.length ? (
        <div className="life-archive-preview">
          {photographs.slice(0, 2).map((photograph) => (
            <figure key={photograph.id}>
              <div className="life-archive-frame"><Image src={photograph.imageUrl} alt={photograph.alt} fill sizes="(max-width: 760px) 100vw, 45vw" /></div>
              <figcaption>{photograph.title}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="life-archive-empty" aria-label="摄影档案正在整理中。">摄影档案正在整理中。</div>
      )}
      <EditorialButton href="/archive" variant="secondary">Open life archive</EditorialButton>
    </section>
  );
}
