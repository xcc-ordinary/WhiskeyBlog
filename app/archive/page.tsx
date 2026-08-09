import type { Metadata } from "next";

import { ArchiveMosaic } from "@/components/exhibition/archive-mosaic";
import { getPublicArchivePhotographs } from "@/lib/public-photographs";
import type { PublicArchiveSourcePhotograph } from "@/lib/public-photographs";

export const metadata: Metadata = {
  title: "Life Archive | WhiskeyBlog",
  description: "WhiskeyBlog 的公开摄影档案。",
};

const playwrightArchiveFixture: PublicArchiveSourcePhotograph[] = [
  {
    id: "published-e2e-fixture",
    thumbnailPath: "derivatives/published/thumbnail.jpg",
    galleryPath: "derivatives/published/gallery.jpg",
    detailPath: "derivatives/published/detail.jpg",
    title: "雾中的山谷",
    alt: "薄雾覆盖的绿色山谷",
    caption: "清晨，莫干山",
    capturedAt: "2026-06-04",
    location: "莫干山",
    category: "自然",
    displayOrder: 1,
    publishedAt: "2026-06-04T00:00:00.000Z",
    status: "published",
  },
  {
    id: "draft-e2e-fixture",
    thumbnailPath: "derivatives/draft/thumbnail.jpg",
    galleryPath: "derivatives/draft/gallery.jpg",
    detailPath: "derivatives/draft/detail.jpg",
    title: "草稿：不应公开",
    alt: "绝不应该显示的私密草稿",
    caption: null,
    capturedAt: null,
    location: null,
    category: null,
    displayOrder: 2,
    publishedAt: "2026-06-04T00:00:00.000Z",
    status: "draft",
  },
];

export default async function ArchivePage() {
  // The fixture is available exclusively to the local Playwright web server; it
  // lets browser tests verify published rendering without reaching a real account.
  const photographs = process.env.PLAYWRIGHT_ARCHIVE_FIXTURE === "1"
    ? await getPublicArchivePhotographs({
      getPublished: async () => playwrightArchiveFixture,
      signDerivativeUrl: async () => "/archive-e2e-frame.svg",
    })
    : await getPublicArchivePhotographs();

  return (
    <div className="archive-page site-container">
      <header className="archive-heading">
        <p className="section-label">摄影札记 / 精选画面</p>
        <h1>Life Archive</h1>
        <p>一些不急于被解释的时刻：光线、城市、路途与正在发生的生活。</p>
      </header>

      {photographs.length ? (
        <ArchiveMosaic photographs={photographs} />
      ) : (
        <section className="archive-empty" aria-label="摄影档案暂未发布">
          <p className="section-label">整理中</p>
          <h2>档案正在整理。</h2>
          <p>新的照片会在被认真命名、描述和发布之后，出现在这里。</p>
        </section>
      )}
    </div>
  );
}
