import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhotographLibrary } from "@/components/studio/photograph-library";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/studio/actions", () => ({
  deleteStudioPhotograph: vi.fn(),
  quickPublishStudioPhotograph: vi.fn(),
  unpublishStudioPhotograph: vi.fn(),
}));
vi.mock("@/components/studio/upload-drawer", () => ({ UploadDrawer: () => <button type="button">上传照片</button> }));

describe("PhotographLibrary", () => {
  it("offers direct publish, edit, and delete controls for each draft", () => {
    render(<PhotographLibrary photographs={[{
      id: "photo-1", originalPath: "owner/photo-1.jpg", thumbnailPath: null, galleryPath: null, detailPath: null,
      title: "晨跑", alt: null, caption: null, capturedAt: null, location: null, category: null, displayOrder: 0,
      crop: {}, status: "draft", createdAt: "2026-08-12T00:00:00.000Z", publishedAt: null,
    }]} />);

    expect(screen.getByRole("button", { name: "发布" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "编辑" }).getAttribute("href")).toBe("/studio/photo-1");
    expect(screen.getByRole("button", { name: "删除" })).toBeTruthy();
  });
});
