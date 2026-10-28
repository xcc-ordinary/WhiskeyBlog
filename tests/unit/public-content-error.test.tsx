import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PublicContentError from "@/app/error";

afterEach(cleanup);
it("offers a working retry and navigation without displaying backend errors or stale content", () => {
  const retry = vi.fn();
  render(<PublicContentError error={new Error("private backend diagnostic")} retry={retry} />);
  fireEvent.click(screen.getByRole("button", { name: "重新载入" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: "认识 Whiskey ↗" }).getAttribute("href")).toBe("/about");
  expect(screen.queryByText("private backend diagnostic")).toBeNull();
});
