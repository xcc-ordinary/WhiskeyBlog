// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readCloudDocuments } from "@/lib/studio-content-store";
const mocks = vi.hoisted(() => ({ connection: vi.fn(), client: vi.fn(), select: vi.fn(), eq: vi.fn() }));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.client }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STUDIO_CONTENT_BACKEND", "supabase");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  mocks.client.mockReturnValue({ from: () => ({ select: mocks.select }) });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockResolvedValue({ data: [], error: null });
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
  });
  it("keeps the repository-only mode independent of request-time APIs", async () => {
    vi.stubEnv("STUDIO_CONTENT_BACKEND", "");
    expect(await readCloudDocuments("posts")).toEqual([]);
    expect(mocks.connection).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });
});
