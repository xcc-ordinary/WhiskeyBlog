import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UploadDrawer } from "@/components/studio/upload-drawer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/studio/actions", () => ({
  createOriginalUploadIntent: vi.fn(),
  createUploadedDraft: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

describe("UploadDrawer", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() { this.setAttribute("open", ""); },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value() { this.removeAttribute("open"); },
    });
  });

  it("opens the native file chooser from its explicit image-selection button", () => {
    render(<UploadDrawer />);

    fireEvent.click(screen.getByRole("button", { name: "上传照片" }));
    const input = screen.getByLabelText("选择图片");
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "选择图片" }));

    expect(click).toHaveBeenCalledOnce();
  });
});
