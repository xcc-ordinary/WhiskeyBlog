// @vitest-environment node
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import matter from "gray-matter";
const mocks = vi.hoisted(() => ({ owner: vi.fn(), read: vi.fn(), save: vi.fn(), localRead: vi.fn(), localWrite: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: mocks.owner }));
vi.mock("@/lib/studio-content-store", () => ({ cloudContentEnabled: () => true, readCloudDocuments: mocks.read, saveCloudDocument: mocks.save }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.localRead, writeFile: mocks.localWrite, readdir: vi.fn(async () => []) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { changeStudioContentState } from "@/app/studio/content-actions";
const document = '---\ntitle: Work\ndescription: A project\nslug: my-work\ndate: "2026-10-20"\ntags: [Design]\n---\n\nA **body**.\n\n#todo\n';
beforeEach(() => { vi.resetAllMocks(); mocks.owner.mockResolvedValue({ id: "owner" }); mocks.read.mockResolvedValue([{ slug: "my-work", document }]); });
afterEach(() => vi.unstubAllEnvs());
it("authenticates before reading and rejects traversal and invalid collection names", async () => {
  mocks.owner.mockRejectedValueOnce(new Error("not owner"));
  expect((await changeStudioContentState("projects", "my-work", true)).ok).toBe(false);
  expect(mocks.read).not.toHaveBeenCalled();
  expect((await changeStudioContentState("projects", "../my-work", true)).ok).toBe(false);
  expect((await changeStudioContentState("elsewhere", "my-work", true)).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
});
it("retains exact body and metadata for cloud removal and restoration without touching files", async () => {
  expect((await changeStudioContentState("projects", "my-work", true)).ok).toBe(true);
  const archived = mocks.save.mock.calls[0][2];
  expect(matter(archived).data.studioDeleted).toBe(true);
  expect(matter(archived).content.trim()).toBe(matter(document).content.trim());
  mocks.read.mockResolvedValue([{ slug: "my-work", document: archived }]);
  expect((await changeStudioContentState("projects", "my-work", false)).ok).toBe(true);
  expect(matter(mocks.save.mock.calls[1][2]).data.studioDeleted).toBeUndefined();
  expect(mocks.localWrite).not.toHaveBeenCalled();
});
