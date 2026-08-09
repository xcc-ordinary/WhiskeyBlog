import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { expect, it } from "vitest";

import { Parallax } from "@/components/exhibition/parallax";

it("keeps visual parallax within the documented speed bounds", () => {
  render(
    <Parallax speed={3}>
      <span>visual layer</span>
    </Parallax>,
  );

  expect(screen.getByTestId("parallax-layer")).toHaveAttribute("data-speed", "0.2");
});
