import { describe, expect, it } from "vitest";

import { getUploadValidationError, isManagedOriginalPath } from "@/lib/supabase/upload";

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

  it("accepts only paths created by the private upload intent", () => {
    expect(isManagedOriginalPath("owner/7b604fe1-2db5-4ae9-b0b1-e513e1f2e23a.jpg")).toBe(true);
    expect(isManagedOriginalPath("owner/my-photo.jpg")).toBe(false);
    expect(isManagedOriginalPath("elsewhere/7b604fe1-2db5-4ae9-b0b1-e513e1f2e23a.jpg")).toBe(false);
  });
});
