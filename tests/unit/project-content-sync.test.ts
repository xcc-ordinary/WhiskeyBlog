// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProject, getProjects } from "@/lib/content";

const files = vi.hoisted(() => ({ source: "" }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("node:fs", () => ({ readdirSync: () => ["new-project.mdx"], readFileSync: () => files.source }));

beforeEach(() => {
  files.source = `---\ntitle: New project\ndescription: A shared summary\ndate: "2026-10-18"\ntags: [Design]\nslug: new-project\n---\n\n## Process\n\n![Finished work](/project-media/first.png)\n`;
});

describe("project publication data", () => {
  it("shares automatically derived cover and reading metadata across list and detail", () => {
    const summary = getProjects()[0];
    expect(summary).toMatchObject({ coverImage: "/project-media/first.png", coverAlt: "Finished work", coverFit: "cover", coverPosition: "center", readingMinutes: 1 });
    expect(getProject("new-project")).toMatchObject({ ...summary, source: expect.stringContaining("## Process") });
  });
  it("keeps an explicit cover and positioning ahead of the body image", () => {
    files.source = files.source.replace("slug: new-project", 'slug: new-project\ncoverImage: /images/explicit.png\ncoverAlt: Chosen cover\ncoverFit: contain\ncoverPosition: 25% 75%');
    expect(getProjects()[0]).toMatchObject({ coverImage: "/images/explicit.png", coverAlt: "Chosen cover", coverFit: "contain", coverPosition: "25% 75%" });
  });
  it("rejects unsupported presentation metadata without writing content", () => {
    files.source = files.source.replace("slug: new-project", "slug: new-project\ncoverFit: stretch");
    expect(() => getProjects()).toThrow("无效内容元数据");
  });
});
