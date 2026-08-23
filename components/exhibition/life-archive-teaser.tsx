import type { JSX } from "react";

import { AsymmetricalParallaxGallery } from "@/components/exhibition/asymmetrical-parallax-gallery";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

export function LifeArchiveTeaser({ photographs }: { photographs: PublicArchivePhotograph[] }): JSX.Element {
  return (
    <section aria-label="Life archive" className="life-archive">
      <AsymmetricalParallaxGallery photographs={photographs} />
    </section>
  );
}
