// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getStudioPhotograph, getStudioPhotographs } from "@/lib/supabase/photographs";
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: vi.fn(async () => ({ id: "owner" })) }));

const row = (id: string, thumbnail: string | null) => ({ id, original_path: `owner/${id}.jpg`, thumbnail_path: thumbnail, gallery_path: thumbnail ? `owner/${id}/gallery.jpg` : null, detail_path: null, title: id, alt: id, caption: null, captured_at: null, location: null, category: null, display_order: 0, crop: {}, status: "draft", created_at: "2026-10-17", published_at: null });
describe("Studio photo loading", () => {
  it("signs library thumbnails in at most one request per bucket", async () => {
    const rows = [row("one", "owner/one/thumb.jpg"), row("two", "owner/two/thumb.jpg"), row("three", null)];
    const sign = vi.fn(async (paths: string[]) => ({ data: paths.map(path => ({ path, signedUrl: `https://preview.test/${path}`, error: null })), error: null }));
    const bucket = vi.fn(() => ({ createSignedUrls: sign }));
    const client = { from: () => ({ select: () => ({ order: async () => ({ data: rows, error: null }) }) }), storage: { from: bucket } } as unknown as SupabaseClient<Database>;
    const photos = await getStudioPhotographs(client);
    expect(sign).toHaveBeenCalledTimes(2);
    expect(sign.mock.calls[0][0]).toEqual(["owner/one/thumb.jpg", "owner/two/thumb.jpg"]);
    expect(photos.map(photo => photo.id)).toEqual(["one", "two", "three"]);
    expect(photos[0].previewUrl).toContain("/thumb.jpg");
  });
  it("loads just one record and one large preview for the editor", async () => {
    const eq = vi.fn(() => ({ maybeSingle: async () => ({ data: row("one", "owner/one/thumb.jpg"), error: null }) }));
    const sign = vi.fn(async () => ({ data: { signedUrl: "https://preview.test/editor.jpg" }, error: null }));
    const client = { from: () => ({ select: () => ({ eq }) }), storage: { from: () => ({ createSignedUrl: sign }) } } as unknown as SupabaseClient<Database>;
    const photo = await getStudioPhotograph("one", client);
    expect(eq).toHaveBeenCalledWith("id", "one");
    expect(sign).toHaveBeenCalledOnce();
    expect(sign).toHaveBeenCalledWith("owner/one/gallery.jpg", 3600);
    expect(photo?.previewUrl).toBe("https://preview.test/editor.jpg");
  });
});
