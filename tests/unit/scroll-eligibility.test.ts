import { describe, expect, it } from "vitest";
import { shouldEnhanceScroll } from "@/lib/scroll-eligibility";

describe("shouldEnhanceScroll", () => {
  it("allows a hydrated desktop fine-pointer user", () => {
    expect(
      shouldEnhanceScroll({
        hasHydrated: true,
        reducedMotion: false,
        coarsePointer: false,
        viewportWidth: 1280,
      }),
    ).toBe(true);
  });

  it.each([
    {
      hasHydrated: false,
      reducedMotion: false,
      coarsePointer: false,
      viewportWidth: 1280,
    },
    {
      hasHydrated: true,
      reducedMotion: true,
      coarsePointer: false,
      viewportWidth: 1280,
    },
    {
      hasHydrated: true,
      reducedMotion: false,
      coarsePointer: true,
      viewportWidth: 1280,
    },
    {
      hasHydrated: true,
      reducedMotion: false,
      coarsePointer: false,
      viewportWidth: 760,
    },
  ])("keeps native scrolling for ineligible environments", (environment) => {
    expect(shouldEnhanceScroll(environment)).toBe(false);
  });
});
