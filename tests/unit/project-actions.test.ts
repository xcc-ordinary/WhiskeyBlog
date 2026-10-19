// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import matter from "gray-matter";
import { saveStudioProjectNotes, uploadStudioProjectImage } from "@/app/studio/projects/actions";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), writable: vi.fn(), access: vi.fn(), mkdir: vi.fn(), write: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: mocks.owner }));
vi.mock("@/lib/content-writes", () => ({ requireRepositoryContentWrites: mocks.writable }));
vi.mock("node:fs/promises", () => ({ access: mocks.access, mkdir: mocks.mkdir, writeFile: mocks.write }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

beforeEach(() => { vi.resetAllMocks(); mocks.access.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })); });
const projectForm = () => {
  const form = new FormData();
  Object.entries({ title: "My work", description: "Edited summary", slug: "test-work", date: "2026-10-17", tags: "Design", source: "## Process", featured: "true", homeOrder: "2", titleEn: "WORK", descriptionEn: "English summary", homeLabel: "PRODUCT", coverImage: "/images/projects/uploads/cover.png" }).forEach(([key, value]) => form.set(key, value));
  return form;
};
describe("project publishing actions", () => {
  it("persists shared homepage fields and invalidates all public project views", async () => {
    expect((await saveStudioProjectNotes(projectForm())).ok).toBe(true);
    const document = String(mocks.write.mock.calls[0][1]);
    expect(matter(document).data).toMatchObject({ featured: true, homeOrder: 2, titleEn: "WORK", descriptionEn: "English summary", homeLabel: "PRODUCT", coverImage: "/images/projects/uploads/cover.png" });
    expect(mocks.revalidate.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining(["/", "/projects", "/projects/test-work", "/studio/projects"]));
  });
  it("rejects invalid ordering without changing content", async () => {
    const form = projectForm(); form.set("homeOrder", "-1");
    expect((await saveStudioProjectNotes(form)).ok).toBe(false);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("publishes a new project to the homepage by default and refreshes the dashboard and sitemap", async () => {
    const form = projectForm(); form.delete("featured");
    expect((await saveStudioProjectNotes(form)).ok).toBe(true);
    expect(matter(String(mocks.write.mock.calls[0][1])).data).toMatchObject({ featured: true, coverFit: "cover", coverPosition: "center" });
    expect(mocks.revalidate.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining(["/studio", "/sitemap.xml"]));
  });
  it("preserves an explicit homepage opt-out and cover presentation metadata", async () => {
    const form = projectForm(); form.set("featured", "false"); form.set("coverFit", "contain"); form.set("coverPosition", "50% 94%");
    expect((await saveStudioProjectNotes(form)).ok).toBe(true);
    expect(matter(String(mocks.write.mock.calls[0][1])).data).toMatchObject({ featured: false, coverFit: "contain", coverPosition: "50% 94%" });
  });
  it("rejects malformed cover positioning before writing", async () => {
    const form = projectForm(); form.set("coverPosition", "50% 101%");
    expect((await saveStudioProjectNotes(form)).ok).toBe(false);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("requires owner authorization and writable storage before either operation", async () => {
    mocks.owner.mockRejectedValue(new Error("owner required"));
    expect((await saveStudioProjectNotes(projectForm())).ok).toBe(false);
    expect((await uploadStudioProjectImage(new FormData())).ok).toBe(false);
    expect(mocks.write).not.toHaveBeenCalled();
    mocks.owner.mockResolvedValue({}); mocks.writable.mockImplementation(() => { throw new Error("read only"); });
    expect((await saveStudioProjectNotes(projectForm())).ok).toBe(false);
    expect((await uploadStudioProjectImage(new FormData())).ok).toBe(false);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("stores a raster upload under a generated name and rejects disguised SVG", async () => {
    const form = new FormData();
    form.set("image", new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], "../../evil.html", { type: "image/png" }));
    const result = await uploadStudioProjectImage(form);
    expect(result).toMatchObject({ ok: true, path: expect.stringMatching(/^\/project-media\/[a-f0-9-]+\.png$/) });
    expect(mocks.write).toHaveBeenCalledOnce();
    form.set("image", new File(['<svg onload="alert(1)"></svg>'], "fake.png", { type: "image/png" }));
    expect((await uploadStudioProjectImage(form)).ok).toBe(false);
    expect(mocks.write).toHaveBeenCalledOnce();
  });
});
