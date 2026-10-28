// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ client: vi.fn(), query: vi.fn(), download: vi.fn(), from: vi.fn(), bucket: vi.fn() }));
vi.mock("@/lib/public-photographs", () => ({ createPublicArchiveClient: mocks.client }));
import { GET } from "@/app/photographs/[id]/route";
const id = "59d49ab1-ccdb-46a1-8ad0-c0df6e6b21f3";
const request = () => GET(new Request(`https://example.test/photographs/${id}`), { params: Promise.resolve({ id }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: mocks.query }) }) });
  mocks.bucket.mockReturnValue({ download: mocks.download });
  mocks.client.mockReturnValue({ from: mocks.from, storage: { from: mocks.bucket } });
  mocks.query.mockResolvedValue({ data: { gallery_path: "owner/photo/display.jpg" }, error: null });
});
it("serves sanitized pixels through a stable URL and checks publication on every request", async () => {
  const original = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "white" } }).withMetadata().jpeg().toBuffer();
  mocks.download.mockResolvedValue({ data: new Blob([new Uint8Array(original)]), error: null });
  const response = await request();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const image = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  expect(image.width).toBe(1600);
  expect(image.format).toBe("webp");
  expect(image.exif).toBeUndefined();
  expect(mocks.from).toHaveBeenCalledWith("published_photographs");
  expect(mocks.bucket).toHaveBeenCalledWith("derivatives");
  mocks.query.mockResolvedValue({ data: null, error: null });
  expect((await request()).status).toBe(404);
  expect(mocks.download).toHaveBeenCalledTimes(1);
});
it.each([null, "originals/private.jpg", "../originals/private.jpg", "https://other.test/file.jpg"])("never reads originals or invalid paths: %s", async path => {
  mocks.query.mockResolvedValue({ data: { gallery_path: path }, error: null });
  expect((await request()).status).toBe(404);
  expect(mocks.download).not.toHaveBeenCalled();
});
it("returns a non-cacheable service error instead of an empty successful image", async () => {
  mocks.query.mockResolvedValue({ data: null, error: { message: "outage" } });
  const response = await request();
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
