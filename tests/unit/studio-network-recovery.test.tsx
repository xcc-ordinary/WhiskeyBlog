import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { PhotographLibrary } from "@/components/studio/photograph-library";
import { PhotographEditor } from "@/components/studio/photograph-editor";
import { quickPublishStudioPhotograph, savePhotographDraft } from "@/app/studio/actions";
import type { StudioPhotograph } from "@/lib/supabase/photographs";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/studio/actions", () => ({ quickPublishStudioPhotograph: vi.fn(), unpublishStudioPhotograph: vi.fn(), deleteStudioPhotograph: vi.fn(), savePhotographDraft: vi.fn() }));
vi.mock("@/components/studio/upload-drawer", () => ({ UploadDrawer: () => <button>上传照片</button> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const photo: StudioPhotograph = { id: "one", originalPath: "owner/one.jpg", thumbnailPath: null, galleryPath: null, detailPath: null, title: "Test", alt: "Test", caption: null, capturedAt: null, location: null, category: null, displayOrder: 0, crop: {}, status: "draft", createdAt: "2026-10-17", publishedAt: null, previewUrl: null };
it("unlocks the library action after a network rejection", async () => {
  vi.mocked(quickPublishStudioPhotograph).mockRejectedValue(new Error("network"));
  render(<PhotographLibrary photographs={[photo]} />);
  fireEvent.click(screen.getByRole("button", { name: "发布" }));
  await screen.findByText("操作未完成，请检查网络后重试。");
  expect(screen.getByRole("button", { name: "发布" })).toBeEnabled();
});
it("unlocks the photo editor after a publication request fails", async () => {
  vi.mocked(savePhotographDraft).mockResolvedValue({ ok: true });
  vi.mocked(quickPublishStudioPhotograph).mockRejectedValue(new Error("network"));
  render(<PhotographEditor photograph={photo} />);
  fireEvent.click(screen.getByRole("button", { name: "发布到公开展示" }));
  await screen.findByText("操作未完成，请检查网络后重试。");
  expect(screen.getByRole("button", { name: "发布到公开展示" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "保存照片信息" })).toBeEnabled();
});

it("saves the current photo information before publishing and stops if saving fails", async () => {
  vi.mocked(savePhotographDraft).mockResolvedValue({ ok: false, message: "资料保存失败" });
  render(<PhotographEditor photograph={photo} />);
  fireEvent.change(screen.getByLabelText("替代文本"), { target: { value: "更新后的画面说明" } });
  fireEvent.click(screen.getByRole("button", { name: "发布到公开展示" }));
  await screen.findByText("资料保存失败");
  expect(vi.mocked(savePhotographDraft).mock.calls[0][1].get("alt")).toBe("更新后的画面说明");
  expect(quickPublishStudioPhotograph).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "发布到公开展示" })).toBeEnabled();
});
