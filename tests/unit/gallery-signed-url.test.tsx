import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsymmetricalParallaxGallery } from "@/components/exhibition/asymmetrical-parallax-gallery";
import { LanguageProvider } from "@/components/language-provider";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";

vi.mock("@/components/exhibition/use-scroll-enhancement", () => ({ useScrollEnhancement: () => false }));

function renderGallery(photographs: PublicArchivePhotograph[]) {
  return render(<LanguageProvider><AsymmetricalParallaxGallery photographs={photographs} /></LanguageProvider>);
}

describe("AsymmetricalParallaxGallery", () => {
  it("loads a signed private-storage URL directly instead of through Next image optimization", () => {
    const signedUrl = "https://project.supabase.co/storage/v1/object/sign/derivatives/owner/photo.png?token=short-lived";
    renderGallery([{
      id: "photo-1", title: "健身照", alt: "健身照", caption: null, capturedAt: null, location: null, galleryUrl: signedUrl, displayOrder: 0,
    }]);

    expect(screen.getByRole("img", { name: "健身照" }).getAttribute("src")).toBe(signedUrl);
  });

  it("uses a pinned horizontal track with editorially offset gallery elements", () => {
    const { container } = renderGallery([]);

    expect(container.querySelector(".gallery-wrapper .gallery-pinned .gallery-track")).toBeTruthy();
    expect(container.querySelectorAll(".gallery-item")).toHaveLength(4);
    expect(container.querySelector(".horizontal-gallery-quote")).toBeTruthy();
  });
});
