import type { Metadata } from "next";

import { ExhibitionHero } from "@/components/exhibition/exhibition-hero";
import { LifeArchiveTeaser } from "@/components/exhibition/life-archive-teaser";
import { SelectedWorks } from "@/components/exhibition/selected-works";
import { getProjects } from "@/lib/content";
import { getPublicArchivePhotographs, type PublicArchiveSourcePhotograph } from "@/lib/public-photographs";

const playwrightGalleryFixture: PublicArchiveSourcePhotograph[] = [
  { id: "gallery-fixture-1", thumbnailPath: "derivatives/fixture/thumb-1.jpg", galleryPath: "derivatives/fixture/gallery-1.jpg", detailPath: "derivatives/fixture/detail-1.jpg", title: "First light", alt: "柔和晨光下的山谷", caption: "Moganshan", capturedAt: "2026-06-04", location: "莫干山", category: "自然", displayOrder: 1, publishedAt: "2026-06-04T00:00:00.000Z", status: "published" },
  { id: "gallery-fixture-2", thumbnailPath: "derivatives/fixture/thumb-2.jpg", galleryPath: "derivatives/fixture/gallery-2.jpg", detailPath: "derivatives/fixture/detail-2.jpg", title: "After rain", alt: "雨后的城市街道", caption: "Shanghai", capturedAt: "2026-07-14", location: "上海", category: "城市", displayOrder: 2, publishedAt: "2026-07-14T00:00:00.000Z", status: "published" },
  { id: "gallery-fixture-3", thumbnailPath: "derivatives/fixture/thumb-3.jpg", galleryPath: "derivatives/fixture/gallery-3.jpg", detailPath: "derivatives/fixture/detail-3.jpg", title: "Quiet corner", alt: "窗边安静的角落", caption: "Home", capturedAt: "2026-07-28", location: "杭州", category: "日常", displayOrder: 3, publishedAt: "2026-07-28T00:00:00.000Z", status: "published" },
  { id: "gallery-fixture-4", thumbnailPath: "derivatives/fixture/thumb-4.jpg", galleryPath: "derivatives/fixture/gallery-4.jpg", detailPath: "derivatives/fixture/detail-4.jpg", title: "Long way", alt: "延伸至远方的道路", caption: "On the road", capturedAt: "2026-08-01", location: "安吉", category: "旅行", displayOrder: 4, publishedAt: "2026-08-01T00:00:00.000Z", status: "published" },
];

export const revalidate = 240;
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const projects = getProjects();
  const photographs = process.env.PLAYWRIGHT_ARCHIVE_FIXTURE === "1"
    ? await getPublicArchivePhotographs({ getPublished: async () => playwrightGalleryFixture, signDerivativeUrl: async () => "/archive-e2e-frame.svg" })
    : await getPublicArchivePhotographs();

  return <><ExhibitionHero /><SelectedWorks projects={projects} /><LifeArchiveTeaser photographs={photographs} /></>;
}
