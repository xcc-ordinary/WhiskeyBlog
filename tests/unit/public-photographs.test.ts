import { describe, expect, it, vi } from "vitest";

import { getPublicArchivePhotographs } from "@/lib/public-photographs";
import type { PublishedPhotograph } from "@/lib/supabase/types";

const published: PublishedPhotograph = {
  id: "published-id",
  thumbnailPath: "published/thumb.jpg",
  galleryPath: "derivatives/published/gallery.jpg",
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

const fakePublishedClient = {
  getPublished: async () => [
    {
      ...published,
      title: "Published image",
      alt: "Published image",
      galleryPath: "derivatives/published/gallery.jpg",
    },
  ],
  signDerivativeUrl: async (path: string) => `https://images.example/${path}`,
};

describe("public photograph archive", () => {
  it("maps only published gallery derivatives into the archive mosaic", async () => {
    const photographs = await getPublicArchivePhotographs(fakePublishedClient);
    expect(photographs[0]).toEqual(expect.objectContaining({ alt: "Published image", galleryUrl: expect.stringContaining("derivatives") }));
    expect("originalPath" in photographs[0]).toBe(false);
  });

  it("creates a short-lived URL only for a published gallery derivative", async () => {
    const signDerivativeUrl = vi.fn().mockResolvedValue("https://images.example/signed-gallery");

    await expect(
      getPublicArchivePhotographs({
        getPublished: async () => [published],
        signDerivativeUrl,
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "published-id", galleryUrl: "https://images.example/signed-gallery", alt: published.alt }),
    ]);

    expect(signDerivativeUrl).toHaveBeenCalledWith("derivatives/published/gallery.jpg", 900);
    expect(signDerivativeUrl).not.toHaveBeenCalledWith("originals/private-source.jpg", expect.anything());
  });

  it("normalizes a bucket-relative Studio path before signing it", async () => {
    const signDerivativeUrl = vi.fn().mockResolvedValue("https://images.example/signed-gallery");

    await expect(getPublicArchivePhotographs({
      getPublished: async () => [{ ...published, galleryPath: "owner/photo-gallery.jpg" }],
      signDerivativeUrl,
    })).resolves.toEqual([expect.objectContaining({ id: "published-id" })]);

    expect(signDerivativeUrl).toHaveBeenCalledWith("derivatives/owner/photo-gallery.jpg", 900);
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

  it("rejects metadata and paths that cannot belong to a published gallery derivative", async () => {
    const signDerivativeUrl = vi.fn().mockResolvedValue("https://images.example/signed-gallery");

    await expect(
      getPublicArchivePhotographs({
        getPublished: async () => [
          { ...published, id: "empty-title", title: "  " },
          { ...published, id: "empty-alt", alt: "  " },
          { ...published, id: "wrong-bucket", galleryPath: "originals/private-source.jpg" },
          { ...published, id: "traversal", galleryPath: "derivatives/../originals/private-source.jpg" },
          { ...published, id: "backslash", galleryPath: "owner\\private-source.jpg" },
          { ...published, id: "external-url", galleryPath: "https://example.com/photo.jpg" },
        ],
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

  it("keeps the public site available when the archive backend is temporarily unavailable", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(getPublicArchivePhotographs({
      getPublished: async () => {
        throw new Error("temporary Supabase outage");
      },
      signDerivativeUrl: vi.fn(),
    })).resolves.toEqual([]);

    expect(report).toHaveBeenCalledWith("Public photograph archive is unavailable.", expect.any(Error));
    report.mockRestore();
  });

  it("keeps public pages available when deployment credentials are missing", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    await expect(getPublicArchivePhotographs()).resolves.toEqual([]);

    expect(report).toHaveBeenCalledWith("Public photograph archive is unavailable.", expect.any(Error));
    report.mockRestore();
    vi.unstubAllEnvs();
  });
});
