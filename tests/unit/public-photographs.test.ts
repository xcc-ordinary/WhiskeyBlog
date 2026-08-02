import { describe, expect, it, vi } from "vitest";

import { getPublicArchivePhotographs } from "@/lib/public-photographs";
import type { PublishedPhotograph } from "@/lib/supabase/types";

const published: PublishedPhotograph = {
  id: "published-id",
  thumbnailPath: "published/thumb.jpg",
  galleryPath: "published/gallery.jpg",
  detailPath: "published/detail.jpg",
  title: "雨后的上海",
  alt: "雨后街道上的橙色出租车",
  caption: "傍晚的静安区",
  capturedAt: "2026-08-02",
  location: "上海",
  category: "城市",
  displayOrder: 2,
  publishedAt: "2026-08-02T00:00:00.000Z",
};

describe("public photograph archive", () => {
  it("creates a short-lived URL only for a published gallery derivative", async () => {
    const signDerivativeUrl = vi.fn().mockResolvedValue("https://images.example/signed-gallery");

    await expect(
      getPublicArchivePhotographs({
        getPublished: async () => [published],
        signDerivativeUrl,
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "published-id", imageUrl: "https://images.example/signed-gallery", alt: published.alt }),
    ]);

    expect(signDerivativeUrl).toHaveBeenCalledWith("published/gallery.jpg", 300);
    expect(signDerivativeUrl).not.toHaveBeenCalledWith("originals/private-source.jpg", expect.anything());
  });

  it("does not surface incomplete records when a view is unexpectedly malformed", async () => {
    const signDerivativeUrl = vi.fn();

    await expect(
      getPublicArchivePhotographs({
        getPublished: async () => [{ ...published, galleryPath: null }, { ...published, id: "missing-alt", alt: null }],
        signDerivativeUrl,
      }),
    ).resolves.toEqual([]);

    expect(signDerivativeUrl).not.toHaveBeenCalled();
  });

  it("filters a draft before it can be signed or rendered", async () => {
    const signDerivativeUrl = vi.fn().mockResolvedValue("https://images.example/signed-gallery");

    const result = await getPublicArchivePhotographs({
      getPublished: async () => [
        { ...published, status: "published" },
        { ...published, id: "private-draft", title: "草稿：不应公开", status: "draft" },
      ],
      signDerivativeUrl,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "published-id", title: "雨后的上海" });
    expect(signDerivativeUrl).toHaveBeenCalledTimes(1);
  });
});
