import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { PhotographEditor } from "@/components/studio/photograph-editor";
import type { Photograph } from "@/lib/supabase/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/studio/actions", () => ({
  quickPublishStudioPhotograph: vi.fn(),
  savePhotographDraft: vi.fn(),
  unpublishStudioPhotograph: vi.fn(),
}));

const photograph: Photograph = {
  id: "photo-1",
  originalPath: "owner/photo-1.jpg",
  thumbnailPath: "owner/photo-1/thumbnail.jpg",
  galleryPath: "owner/photo-1/gallery.jpg",
  detailPath: "owner/photo-1/detail.jpg",
  title: "港口晨光",
  alt: "晨光照在港口水面",
  caption: "清晨",
  capturedAt: "2026-08-20",
  location: "上海",
  category: "城市",
  displayOrder: 3,
  crop: { x: 0.5, y: 0.4 },
  status: "published",
  createdAt: "2026-08-20T00:00:00.000Z",
  publishedAt: "2026-08-21T00:00:00.000Z",
};

describe("PhotographEditor", () => {
  it("preserves and exposes every public display setting while editing", () => {
    render(<PhotographEditor photograph={photograph} />);

    expect(screen.getByLabelText("缩略图路径")).toHaveValue("owner/photo-1/thumbnail.jpg");
    expect(screen.getByLabelText("画廊图路径")).toHaveValue("owner/photo-1/gallery.jpg");
    expect(screen.getByLabelText("详情图路径")).toHaveValue("owner/photo-1/detail.jpg");
    expect(screen.getByLabelText("展示排序")).toHaveValue(3);
    expect(screen.getByRole("button", { name: "撤回公开展示" })).toBeTruthy();
  });
});
