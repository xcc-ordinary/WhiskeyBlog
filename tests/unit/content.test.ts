import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPost, getPosts, getProjects } from "@/lib/content";

describe("post content", () => {
  it("sorts posts by date descending", () => {
    expect(getPosts().map((post) => post.slug)).toEqual(["building-this-site"]);
  });

  it("returns null for an unknown post", () => {
    expect(getPost("missing")).toBeNull();
  });
});

describe("project content", () => {
  it("reads optional editorial cover metadata when every value is a string", () => {
    const project = getProjects().find((item) => item.slug === "whiskey-blog");

    expect(project).toMatchObject({
      coverImage: "/images/placeholders/hero-editorial.svg",
      coverAlt: "WhiskeyBlog 项目封面占位图",
      role: "Design / Development",
    });
  });

  it("rejects optional editorial metadata with a non-string value", () => {
    const fixturePath = path.join(process.cwd(), "content", "projects", "invalid-editorial-meta.mdx");
    writeFileSync(fixturePath, `---
title: "Invalid"
description: "Invalid fixture"
date: "2026-08-03"
tags: ["Test"]
slug: "invalid-editorial-meta"
coverImage: 42
---
`);

    try {
      expect(() => getProjects()).toThrow("无效内容元数据");
    } finally {
      unlinkSync(fixturePath);
    }
  });
});
