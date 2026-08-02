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
});
