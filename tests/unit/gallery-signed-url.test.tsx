import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsymmetricalParallaxGallery } from "@/components/exhibition/asymmetrical-parallax-gallery";

vi.mock("@/components/exhibition/use-scroll-enhancement", () => ({ useScrollEnhancement: () => false }));

describe("AsymmetricalParallaxGallery", () => {
  it("loads a signed private-storage URL directly instead of through Next image optimization", () => {
    const signedUrl = "https://project.supabase.co/storage/v1/object/sign/derivatives/owner/photo.png?token=short-lived";
    render(<AsymmetricalParallaxGallery photographs={[{
      id: "photo-1", title: "健身照", alt: "健身照", caption: null, capturedAt: null, location: null, galleryUrl: signedUrl, displayOrder: 0,
    }]} />);

    expect(screen.getByRole("img", { name: "健身照" }).getAttribute("src")).toBe(signedUrl);
  });

  it("uses a pinned horizontal track with editorially offset gallery elements", () => {
    const { container } = render(<AsymmetricalParallaxGallery photographs={[]} />);

    expect(container.querySelector(".gallery-wrapper .gallery-pinned .gallery-track")).toBeTruthy();
    expect(container.querySelectorAll(".gallery-item")).toHaveLength(4);
    expect(container.querySelector(".horizontal-gallery-quote")).toBeTruthy();
  });
});
