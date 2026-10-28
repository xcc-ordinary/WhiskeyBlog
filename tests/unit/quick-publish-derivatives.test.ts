// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ server: vi.fn(), owner: vi.fn(), download: vi.fn(), upload: vi.fn(), update: vi.fn(), publish: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: mocks.owner }));
vi.mock("@/lib/supabase/photographs", () => ({ createDraftPhotograph: vi.fn(), deletePhotograph: vi.fn(), publishPhotograph: mocks.publish, unpublishPhotograph: vi.fn(), updatePhotograph: mocks.update }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { quickPublishStudioPhotograph } from "@/app/studio/actions";
const id = "59d49ab1-ccdb-46a1-8ad0-c0df6e6b21f3";
beforeEach(async () => {
  vi.resetAllMocks();
  const bytes = await sharp({ create: { width: 100, height: 60, channels: 3, background: "white" } }).withMetadata().jpeg().toBuffer();
  mocks.download.mockResolvedValue({ data: new Blob([new Uint8Array(bytes)]), error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.server.mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id, original_path: "owner/original.jpg", title: "Photo", alt: "A photo", thumbnail_path: "owner/old/display.jpg", gallery_path: "owner/old/display.jpg", detail_path: "owner/old/display.jpg" }, error: null }) }) }) }),
    storage: { from: () => ({ download: mocks.download, upload: mocks.upload }) },
  });
});
it("replaces legacy copies with three encoded images before publishing", async () => {
  expect(await quickPublishStudioPhotograph(id)).toMatchObject({ ok: true });
  expect(mocks.upload).toHaveBeenCalledTimes(3);
  for (const [, bytes, options] of mocks.upload.mock.calls) {
    expect(options).toEqual({ contentType: "image/webp", upsert: false });
    const metadata = await sharp(bytes).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
  }
  const paths = mocks.upload.mock.calls.map(([path]) => path);
  expect(new Set(paths).size).toBe(3);
  expect(mocks.update).toHaveBeenCalledWith(id, expect.objectContaining({ thumbnailPath: paths[0], galleryPath: paths[1], detailPath: paths[2] }), expect.anything());
  expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.publish.mock.invocationCallOrder[0]);
});
it("does not switch published pointers when a derivative upload fails", async () => {
  mocks.upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "unavailable" } });
  expect(await quickPublishStudioPhotograph(id)).toMatchObject({ ok: false });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.publish).not.toHaveBeenCalled();
});
it("does not download or process private originals for an unauthorized user", async () => {
  mocks.owner.mockRejectedValue(new Error("owner required"));
  expect(await quickPublishStudioPhotograph(id)).toMatchObject({ ok: false });
  expect(mocks.download).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
});
