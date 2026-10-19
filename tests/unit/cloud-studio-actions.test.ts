// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveStudioPost, uploadStudioPostCover } from "@/app/studio/writing/actions";
import { saveStudioProjectNotes, uploadStudioProjectImage } from "@/app/studio/projects/actions";
const mocks = vi.hoisted(() => ({ owner: vi.fn(), localGuard: vi.fn(), access: vi.fn(), write: vi.fn(), save: vi.fn(), upload: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: mocks.owner }));
vi.mock("@/lib/content-writes", () => ({ requireRepositoryContentWrites: mocks.localGuard }));
vi.mock("@/lib/studio-content-store", () => ({ cloudContentEnabled: () => true, saveCloudDocument: mocks.save, uploadCloudContentImage: mocks.upload }));
vi.mock("node:fs/promises", () => ({ access: mocks.access, mkdir: mocks.write, writeFile: mocks.write }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockRejectedValue(Object.assign(new Error(), { code: "ENOENT" }));
  mocks.upload.mockResolvedValue("https://example.supabase.co/storage/v1/object/public/content-images/owner/test.png");
  mocks.localGuard.mockImplementation(() => { throw new Error("Vercel filesystem is read only"); });
});
function form() {
  const data = new FormData();
  Object.entries({ title: "Online work", description: "Published online", slug: "online-work", date: "2026-10-19", tags: "Design", source: "## Saved online" }).forEach(([key, value]) => data.set(key, value));
  return data;
}
describe("cloud Studio saves and uploads", () => {
  it.each([["posts", saveStudioPost], ["projects", saveStudioProjectNotes]] as const)("persists %s without writing Vercel files", async (collection, save) => {
    expect(await save(form())).toMatchObject({ ok: true });
    expect(mocks.save).toHaveBeenCalledWith(collection, "online-work", expect.stringContaining("## Saved online"), false);
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.localGuard).not.toHaveBeenCalled();
  });
  it.each([["cover", uploadStudioPostCover], ["image", uploadStudioProjectImage]] as const)("uploads %s to durable image storage", async (field, upload) => {
    const data = new FormData();
    data.set(field, new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], "art.png", { type: "image/png" }));
    expect(await upload(data)).toMatchObject({ ok: true, path: expect.stringContaining("content-images") });
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(Buffer), "png");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("does not publish or upload for an unauthorized account", async () => {
    mocks.owner.mockRejectedValue(new Error("owner required"));
    expect(await saveStudioPost(form())).toMatchObject({ ok: false });
    expect(await saveStudioProjectNotes(form())).toMatchObject({ ok: false });
    expect(await uploadStudioPostCover(new FormData())).toMatchObject({ ok: false });
    expect(await uploadStudioProjectImage(new FormData())).toMatchObject({ ok: false });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("returns a storage failure without claiming a successful publication", async () => {
    mocks.save.mockRejectedValue(new Error("storage unavailable"));
    expect(await saveStudioPost(form())).toEqual({ ok: false, message: "storage unavailable" });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
