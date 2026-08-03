import Image from "next/image";
import type { JSX } from "react";

import type { PublicArchivePhotograph } from "@/lib/public-photographs";

function archiveDateline(photo: PublicArchivePhotograph) {
  return [photo.capturedAt, photo.location].filter(Boolean).join(" · ");
}

export function ArchiveMosaic({ photographs }: { photographs: PublicArchivePhotograph[] }): JSX.Element {
  return (
    <section aria-label="Life archive" className="archive-mosaic">
      {photographs.map((photo, index) => (
        <figure className={`archive-item archive-item-${index % 5}`} key={photo.id}>
          <div className="archive-item-frame">
            <Image alt={photo.alt} fill sizes="(max-width: 760px) 50vw, 33vw" src={photo.galleryUrl} />
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
