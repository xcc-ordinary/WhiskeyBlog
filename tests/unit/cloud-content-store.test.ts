// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readCloudDocuments, readOwnerCloudDocuments, saveCloudDocument } from "@/lib/studio-content-store";
const mocks = vi.hoisted(() => ({ connection: vi.fn(), client: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), abortSignal: vi.fn(), server: vi.fn(), owner: vi.fn(), insert: vi.fn(), upsert: vi.fn() }));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.client }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: mocks.owner }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STUDIO_CONTENT_BACKEND", "supabase");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  mocks.client.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ abortSignal: mocks.abortSignal });
  mocks.abortSignal.mockResolvedValue({ data: [], error: null });
  mocks.server.mockResolvedValue({ from: mocks.from });
});
afterEach(() => vi.unstubAllEnvs());
describe("cloud content render timing", () => {
  it("does not query cloud content during build-time prerendering", async () => {
    mocks.connection.mockRejectedValue(new Error("NEXT_PRERENDER_BAILOUT"));
    await expect(readCloudDocuments("posts")).rejects.toThrow("NEXT_PRERENDER_BAILOUT");
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("reads online documents after an incoming request exists", async () => {
    expect(await readCloudDocuments("projects")).toEqual([]);
    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenCalledWith("collection", "projects");
    expect(mocks.from).toHaveBeenCalledWith("public_studio_documents");
  });
  it("keeps the repository-only mode independent of request-time APIs", async () => {
    vi.stubEnv("STUDIO_CONTENT_BACKEND", "");
    expect(await readCloudDocuments("posts")).toEqual([]);
    expect(mocks.connection).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("fails closed on an outage instead of returning an empty successful collection", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.abortSignal.mockResolvedValue({ data: null, error: { code: "PGRST205", message: "private details" } });
    await expect(readCloudDocuments("posts")).rejects.toThrow("内容暂时无法载入");
    expect(report).toHaveBeenCalledWith("Public content read failed.", { code: "PGRST205" });
    report.mockRestore();
  });
  it("authorizes the owner before reading full recycled documents", async () => {
    mocks.owner.mockRejectedValueOnce(new Error("denied"));
    await expect(readOwnerCloudDocuments("posts")).rejects.toThrow("denied");
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.eq.mockResolvedValue({ data: [{ slug: "removed", document: "private body" }], error: null });
    expect(await readOwnerCloudDocuments("posts")).toEqual([{ slug: "removed", document: "private body" }]);
    expect(mocks.from).toHaveBeenCalledWith("studio_documents");
  });
  it("persists deletion and restoration as an explicit access-control field", async () => {
    mocks.from.mockReturnValue({ insert: mocks.insert, upsert: mocks.upsert });
    mocks.upsert.mockResolvedValue({ error: null });
    await saveCloudDocument("posts", "removed", "---\nstudioDeleted: true\n---\nprivate body", true);
    expect(mocks.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ is_deleted: true }), { onConflict: "collection,slug" });
    await saveCloudDocument("posts", "removed", "---\ntitle: Restored\n---\nbody", true);
    expect(mocks.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ is_deleted: false }), { onConflict: "collection,slug" });
  });
});
