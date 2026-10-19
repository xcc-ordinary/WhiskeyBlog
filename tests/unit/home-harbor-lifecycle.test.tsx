import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HomeHarborScene } from "@/components/exhibition/home-harbor-scene";

const loader = vi.hoisted(() => vi.fn());
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/components/exhibition/volumetric-harbor", () => ({ createVolumetricHarbor: loader }));
let intersection: (entries: { isIntersecting: boolean }[]) => void;
let reduced = false;

beforeEach(() => {
  reduced = false;
  loader.mockReset();
  vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof intersection) { intersection = callback; }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it("does not construct a GPU renderer when reduced motion is requested", async () => {
  reduced = true;
  const { container } = render(<HomeHarborScene />);
  await act(async () => { intersection([{ isIntersecting: true }]); });
  expect(container.querySelector(".home-harbor")?.getAttribute("data-state")).toBe("static");
  expect(loader).not.toHaveBeenCalled();
});

it("retains the poster when the model or GPU initialization fails", async () => {
  loader.mockRejectedValue(new Error("GPU unavailable"));
  const { container } = render(<HomeHarborScene />);
  await act(async () => { intersection([{ isIntersecting: true }]); });
  await waitFor(() => expect(container.querySelector(".home-harbor")?.getAttribute("data-state")).toBe("fallback"));
});

it("disposes a renderer that finishes loading after the component was removed", async () => {
  let finish: (value: unknown) => void = () => {};
  loader.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const rendered = render(<HomeHarborScene />);
  await act(async () => { intersection([{ isIntersecting: true }]); });
  await waitFor(() => expect(loader).toHaveBeenCalledOnce());
  rendered.unmount();
  const dispose = vi.fn();
  await act(async () => { finish({ dispose, pause: vi.fn(), visible: vi.fn() }); });
  expect(dispose).toHaveBeenCalledOnce();
});
