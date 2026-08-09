import { describe, expect, it } from "vitest";
import { isPublicScrollPath, shouldEnhanceScroll } from "@/lib/scroll-eligibility";

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

describe("isPublicScrollPath", () => {
  it.each(["/studio", "/studio/login", "/studio/photo-id", "/auth", "/auth/callback"])(
    "keeps the cinematic enhancement out of protected and authentication routes",
    (pathname) => {
      expect(isPublicScrollPath(pathname)).toBe(false);
    },
  );

  it.each(["/", "/archive", "/projects/whiskey-blog", "/blog"])(
    "allows the public exhibition route %s",
    (pathname) => {
      expect(isPublicScrollPath(pathname)).toBe(true);
    },
  );
});
