import { describe, expect, it } from "vitest";

import { repositoryContentWritesAvailable, requireRepositoryContentWrites, studioContentWritesAvailable } from "@/lib/content-writes";

describe("repository content writes", () => {
  it("enables cloud Studio editing on Vercel without enabling filesystem writes", () => {
    const environment = { VERCEL: "1", STUDIO_CONTENT_BACKEND: "supabase" };
    expect(studioContentWritesAvailable(environment)).toBe(true);
    expect(repositoryContentWritesAvailable(environment)).toBe(false);
    expect(studioContentWritesAvailable({ VERCEL: "1" })).toBe(false);
  });
  it("allows local repository-backed editing", () => {
    expect(repositoryContentWritesAvailable({})).toBe(true);
    expect(() => requireRepositoryContentWrites({})).not.toThrow();
  });

  it("rejects ephemeral Vercel filesystem writes", () => {
    const environment = { VERCEL: "1" };

    expect(repositoryContentWritesAvailable(environment)).toBe(false);
    expect(() => requireRepositoryContentWrites(environment)).toThrow(/通过 Git 发布/);
  });
});
