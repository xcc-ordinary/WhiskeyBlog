import Image from "next/image";
import type { JSX } from "react";

import { Parallax } from "@/components/exhibition/parallax";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

const archiveSpeeds = [-0.08, 0.06, -0.04, 0.08, -0.06] as const;

function archiveDateline(photo: PublicArchivePhotograph) {
  return [photo.capturedAt, photo.location].filter(Boolean).join(" · ");
}

export function ArchiveMosaic({ photographs }: { photographs: PublicArchivePhotograph[] }): JSX.Element {
  return (
    <section aria-label="生活影像档案" className="archive-mosaic">
      {photographs.map((photo, index) => {
        const dateline = archiveDateline(photo);

        return (
          <figure className={`archive-item archive-item-${index % 5}`} key={photo.id}>
            <div className="archive-item-matte">
              <div className="archive-item-frame">
                <Parallax className="visual-camera-layer" speed={archiveSpeeds[index % archiveSpeeds.length]}>
                  <Image alt={photo.alt} fill sizes="(max-width: 760px) 90vw, 58vw" src={photo.galleryUrl} unoptimized />
                </Parallax>
              </div>
            </div>
            <figcaption>
              <span className="archive-item-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="archive-item-copy">
                <strong>{photo.title}</strong>
                {dateline ? <span>{dateline}</span> : null}
                {photo.caption ? <span>{photo.caption}</span> : null}
              </span>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}
