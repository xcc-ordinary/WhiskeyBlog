import type { Metadata } from "next";
import Image from "next/image";

import { getPublicArchivePhotographs } from "@/lib/public-photographs";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

export const metadata: Metadata = {
  title: "Life Archive | WhiskeyBlog",
  description: "WhiskeyBlog 的公开摄影档案。",
};

function editorialDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  return year && month && day ? `${year}.${month}.${day}` : value;
}

const playwrightArchiveFixture: PublicArchivePhotograph[] = [
  {
    id: "published-e2e-fixture",
    imageUrl: "/archive-e2e-frame.svg",
    title: "雾中的山谷",
    alt: "薄雾覆盖的绿色山谷",
    caption: "清晨，莫干山",
    capturedAt: "2026-06-04",
    location: "莫干山",
    category: "自然",
    displayOrder: 1,
    publishedAt: "2026-06-04T00:00:00.000Z",
  },
];

export default async function ArchivePage() {
  // The fixture is available exclusively to the local Playwright web server; it
  // lets browser tests verify published rendering without reaching a real account.
  const photographs = process.env.PLAYWRIGHT_ARCHIVE_FIXTURE === "1"
    ? playwrightArchiveFixture
    : await getPublicArchivePhotographs();

  return (
    <section className="archive-page site-container">
      <header className="archive-heading">
        <p className="studio-kicker">FIELD NOTES / SELECTED FRAMES</p>
        <h1>Life Archive</h1>
        <p>一些不急于被解释的时刻：光线、城市、路途与正在发生的生活。</p>
      </header>

      {photographs.length ? (
        <div className="archive-grid" aria-label="已发布摄影作品">
          {photographs.map((photograph, index) => (
            <article className={`archive-entry archive-entry-${(index % 5) + 1}`} key={photograph.id}>
              <div className="archive-image-frame">
                <Image
                  src={photograph.imageUrl}
                  alt={photograph.alt}
                  fill
                  sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 980px) calc(50vw - 36px), 52vw"
                  className="archive-image"
                />
              </div>
              <div className="archive-entry-meta">
                <p className="archive-entry-index">{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <h2>{photograph.title}</h2>
                  <p>{[editorialDate(photograph.capturedAt), photograph.location, photograph.category].filter(Boolean).join(" · ")}</p>
                  {photograph.caption ? <p className="archive-entry-caption">{photograph.caption}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="archive-empty" aria-label="摄影档案暂未发布">
          <p className="studio-kicker">IN THE MAKING</p>
          <h2>档案正在整理。</h2>
          <p>新的照片会在被认真命名、描述和发布之后，出现在这里。</p>
        </section>
      )}
    </section>
  );
}
