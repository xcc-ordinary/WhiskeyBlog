import { describe, expect, it } from "vitest";
import { getPost, getPosts } from "@/lib/content";

describe("post content", () => {
  it("sorts posts by date descending", () => {
    expect(getPosts().map((post) => post.slug)).toEqual(["building-this-site"]);
  });

  it("returns null for an unknown post", () => {
    expect(getPost("missing")).toBeNull();
  });
});
