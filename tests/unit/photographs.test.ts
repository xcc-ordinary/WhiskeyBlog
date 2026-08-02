import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  createDraftPhotograph,
  getPublishedPhotographs,
  publishPhotograph,
  updatePhotograph,
} from "@/lib/supabase/photographs";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

function asClient(value: object): Client {
  return value as Client;
}

function deniedClient() {
  const from = vi.fn(() => {
    throw new Error("A rejected owner must not query or mutate photographs.");
  });

  return asClient({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from,
  });
}

describe("photograph data access", () => {
  it("reads public photographs only through the published projection", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));

    await getPublishedPhotographs(asClient({ from }));

    expect(from).toHaveBeenCalledWith("published_photographs");
    expect(select).toHaveBeenCalledWith(
      "id, thumbnail_path, gallery_path, detail_path, title, alt, caption, captured_at, location, category, display_order, published_at",
    );
    expect(order).toHaveBeenCalledWith("display_order", { ascending: true });
  });

  it.each([
    ["create a draft", (client: Client) => createDraftPhotograph({ originalPath: "originals/one.jpg" }, client)],
    ["update a photograph", (client: Client) => updatePhotograph("photo-id", { title: "Title" }, client)],
    ["publish a photograph", (client: Client) => publishPhotograph("photo-id", client)],
  ])("does not let an anonymous visitor %s", async (_action, operation) => {
    await expect(operation(deniedClient())).rejects.toMatchObject({ status: 401 });
  });
});
