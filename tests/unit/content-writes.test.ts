import { describe, expect, it } from "vitest";

import { repositoryContentWritesAvailable, requireRepositoryContentWrites } from "@/lib/content-writes";

describe("repository content writes", () => {
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
