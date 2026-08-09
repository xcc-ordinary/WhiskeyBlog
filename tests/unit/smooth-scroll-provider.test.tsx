import { cleanup, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SmoothScrollProvider } from "@/components/exhibition/smooth-scroll-provider";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";

const pathname = vi.hoisted(() => ({ value: "/" }));
const lenis = vi.hoisted(() => ({
  constructed: vi.fn(),
  destroy: vi.fn(),
  resize: vi.fn(),
  scrollTo: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
vi.mock("lenis", () => ({
  default: class MockLenis {
    constructor() {
      lenis.constructed();
    }

    destroy() {
      lenis.destroy();
    }

    resize() {
      lenis.resize();
    }

    scrollTo(target: HTMLElement, options?: { force?: boolean }) {
      lenis.scrollTo(target, options);
    }
  },
}));

describe("SmoothScrollProvider", () => {
  beforeEach(() => {
    pathname.value = "/";
    window.history.replaceState(null, "", "/");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        matches: query === "(pointer: coarse)" ? false : false,
        media: query,
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.smoothScroll;
    vi.clearAllMocks();
  });

  it("routes hash-only navigation through the active Lenis instance", async () => {
    render(
      <SmoothScrollProvider>
        <div id="selected-work">Selected work</div>
      </SmoothScrollProvider>,
    );

    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-smooth-scroll", "enabled"));
    window.history.pushState(null, "", "#selected-work");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(lenis.resize).toHaveBeenCalled();
      expect(lenis.scrollTo).toHaveBeenCalledWith(document.getElementById("selected-work"), { force: true });
    });
  });

  it("does not construct Lenis on Studio routes", async () => {
    pathname.value = "/studio/login";
    render(<PublicScrollBoundary>Studio login</PublicScrollBoundary>);

    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-smooth-scroll"));
    expect(lenis.constructed).not.toHaveBeenCalled();
  });

  it("destroys the public enhancement before rendering a Studio route", async () => {
    const view = render(<PublicScrollBoundary>Public page</PublicScrollBoundary>);
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-smooth-scroll", "enabled"));

    pathname.value = "/studio";
    view.rerender(<PublicScrollBoundary>Studio</PublicScrollBoundary>);

    await waitFor(() => expect(document.documentElement).not.toHaveAttribute("data-smooth-scroll"));
    expect(lenis.destroy).toHaveBeenCalledOnce();
  });
});
