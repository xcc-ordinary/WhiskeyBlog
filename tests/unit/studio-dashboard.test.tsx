import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import StudioPage from "@/app/studio/page";

const mocks = vi.hoisted(() => ({ photographs: vi.fn(async () => []) }));
vi.mock("@/lib/supabase/auth", () => ({ requireOwner: vi.fn(async () => ({ id: "owner" })), MediaStudioAuthorizationError: class extends Error {} }));
vi.mock("@/lib/supabase/photographs", () => ({ getStudioPhotographs: mocks.photographs }));
vi.mock("@/lib/content", () => ({ getPosts: () => [], getProjects: () => [] }));
vi.mock("@/app/studio/actions", () => ({ signOutOfStudio: vi.fn() }));
vi.mock("@/components/exhibition/living-scene", () => ({ LivingScene: () => <div data-testid="decorative-scene" /> }));
vi.mock("@/components/studio/photograph-library", () => ({ PhotographLibrary: () => <div>照片资料库</div> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("opens the content dashboard without a GPU scene or waiting for the photo library", async () => {
  render(await StudioPage());
  expect(screen.queryByTestId("decorative-scene")).not.toBeInTheDocument();
  expect(mocks.photographs).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "内容管理" })).toBeVisible();
});
