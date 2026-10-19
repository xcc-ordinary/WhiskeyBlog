import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArchiveMosaic } from "@/components/exhibition/archive-mosaic";
import { LanguageProvider } from "@/components/language-provider";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

vi.mock("@/components/exhibition/use-scroll-enhancement", () => ({ useScrollEnhancement: () => false }));

function renderGallery(photographs: PublicArchivePhotograph[]) {
  return render(<LanguageProvider><ArchiveMosaic photographs={photographs} /></LanguageProvider>);
}

afterEach(cleanup);
describe("ArchiveMosaic", () => {
  it("loads a signed private-storage URL directly instead of through Next image optimization", () => {
    const signedUrl = "https://project.supabase.co/storage/v1/object/sign/derivatives/owner/photo.png?token=short-lived";
    renderGallery([{
      id: "photo-1", title: "健身照", alt: "健身照", caption: null, capturedAt: null, location: null, galleryUrl: signedUrl, displayOrder: 0,
    }]);

    expect(screen.getByRole("img", { name: "健身照" }).getAttribute("src")).toBe(signedUrl);
  });

  it("does not substitute private uploads or invented photographs for an empty archive", () => {
    const { container } = renderGallery([]);

    expect(container.querySelector(".archive-mosaic")).toBeTruthy();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});
