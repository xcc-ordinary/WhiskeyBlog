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
      {photographs.map((photo, index) => (
        <figure className={`archive-item archive-item-${index % 5}`} key={photo.id}>
          <div className="archive-item-frame">
            <Parallax className="visual-camera-layer" speed={archiveSpeeds[index % archiveSpeeds.length]}>
              <Image alt={photo.alt} fill sizes="(max-width: 760px) 50vw, 33vw" src={photo.galleryUrl} unoptimized />
            </Parallax>
          </div>
          <figcaption>
            <strong>{photo.title}</strong>
            {archiveDateline(photo) ? <span>{archiveDateline(photo)}</span> : null}
            {photo.caption ? <span>{photo.caption}</span> : null}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}
