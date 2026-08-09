import { describe, expect, it } from "vitest";

import { getPublishValidationError } from "@/lib/supabase/photographs";

describe("photograph publishing validation", () => {
  it("rejects a draft without a title and alternative text", () => {
    expect(
      getPublishValidationError({
        title: "   ",
        alt: null,
        thumbnailPath: "derivatives/photo-thumbnail.jpg",
        galleryPath: "derivatives/photo-gallery.jpg",
        detailPath: "derivatives/photo-detail.jpg",
      }),
    ).toBe("请先补充照片标题和替代文本。");
  });

  it("rejects a draft without all public derivative paths", () => {
    expect(
      getPublishValidationError({
        title: "晨光",
        alt: "窗边的植物",
        thumbnailPath: null,
        galleryPath: "derivatives/photo-gallery.jpg",
        detailPath: "derivatives/photo-detail.jpg",
      }),
    ).toBe("请先填写三种公开衍生图路径。");
  });

  it("accepts both current and legacy derivative object paths", () => {
    expect(getPublishValidationError({
      title: "晨光",
      alt: "窗边的植物",
      thumbnailPath: "owner/photo-thumbnail.jpg",
      galleryPath: "derivatives/owner/photo-gallery.jpg",
      detailPath: "owner/photo-detail.jpg",
    })).toBeNull();
  });

  it("rejects paths outside the derivatives bucket", () => {
    expect(getPublishValidationError({
      title: "晨光",
      alt: "窗边的植物",
      thumbnailPath: "owner/photo-thumbnail.jpg",
      galleryPath: "originals/private-source.jpg",
      detailPath: "https://example.com/photo.jpg",
    })).toBe("公开衍生图路径必须是 derivatives bucket 内的对象路径。");
  });
});
