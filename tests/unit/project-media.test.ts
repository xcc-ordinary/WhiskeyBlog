// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "@/app/project-media/[filename]/route";
import { readFile } from "node:fs/promises";
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const request = (filename: string) => GET(new Request("http://localhost/project-media/test"), { params: Promise.resolve({ filename }) });
it("serves a newly written upload without a production build", async () => {
  vi.mocked(readFile).mockResolvedValue(Buffer.from([137,80,78,71]));
  const response = await request("12345678-1234-1234-1234-123456789abc.png");
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("image/png");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137,80,78,71]));
});
it("rejects arbitrary paths and unsupported extensions before reading the filesystem", async () => {
  for (const path of ["../../.env.local", "secret.png", "12345678-1234-1234-1234-123456789abc.svg"]) expect((await request(path)).status).toBe(404);
  expect(readFile).not.toHaveBeenCalled();
});
it("returns 404 when a valid upload URL has no file", async () => {
  vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  expect((await request("12345678-1234-1234-1234-123456789abc.jpg")).status).toBe(404);
});
