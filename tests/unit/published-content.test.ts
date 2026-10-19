// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPosts, getPost, getProjects, getProject } from "@/lib/published-content";
const cloud = vi.hoisted(() => vi.fn());
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/lib/studio-content-store", () => ({ readCloudDocuments: cloud }));
const document = (slug: string, title = "Online edit") => `---\ntitle: ${title}\ndescription: Saved in the Studio\ndate: "2026-10-19"\ntags: [Design]\nslug: ${slug}\n---\n\n## Online body\n\n![Cover](https://example.supabase.co/storage/v1/object/public/content-images/owner/test.png)`;
beforeEach(() => { vi.resetAllMocks(); cloud.mockResolvedValue([]); });
describe("published content shared by Studio and public routes", () => {
  it("retains repository content before the cloud store has any rows", async () => {
    expect((await getPosts()).length).toBeGreaterThan(0);
    expect(await getProject("whiskey-blog")).toMatchObject({ slug: "whiskey-blog" });
    expect(await getPost("missing")).toBeNull();
  });
  it("shows a newly saved online post in both the index and detail", async () => {
    cloud.mockImplementation(async collection => collection === "posts" ? [{ slug: "cloud-note", document: document("cloud-note") }] : []);
    expect((await getPosts())[0]).toMatchObject({ slug: "cloud-note", title: "Online edit" });
    expect(await getPost("cloud-note")).toMatchObject({ title: "Online edit", source: expect.stringContaining("## Online body") });
  });
  it("overrides existing local projects once without losing cover fallback", async () => {
    cloud.mockImplementation(async collection => collection === "projects" ? [{ slug: "whiskey-blog", document: document("whiskey-blog") }] : []);
    expect((await getProjects()).filter(item => item.slug === "whiskey-blog")).toHaveLength(1);
    expect(await getProject("whiskey-blog")).toMatchObject({ title: "Online edit", coverImage: expect.stringContaining("content-images"), coverAlt: "Cover" });
  });
  it("surfaces cloud outages instead of silently showing stale repository content", async () => {
    cloud.mockRejectedValue(new Error("unavailable"));
    await expect(getProjects()).rejects.toThrow("unavailable");
  });
});
