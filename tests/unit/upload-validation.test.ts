import { describe, expect, it } from "vitest";

import { getUploadValidationError } from "@/lib/supabase/upload";

describe("photograph upload validation", () => {
  it("rejects a file outside the supported image formats", () => {
    expect(getUploadValidationError({ name: "notes.pdf", size: 100, type: "application/pdf" })).toBe(
      "请选择 JPG、PNG、WebP 或 AVIF 格式的图片。",
    );
  });

  it("rejects a file larger than the owner upload limit", () => {
    expect(getUploadValidationError({ name: "large.jpg", size: 20 * 1024 * 1024 + 1, type: "image/jpeg" })).toBe(
      "单张照片不能超过 20 MB。",
    );
  });
});
