import { useState } from "react";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, it, expect } from "vitest";
import { LiveManuscript } from "@/components/studio/live-manuscript";
afterEach(cleanup);
it("edits a selected paragraph without changing surrounding code fences, whitespace or references", () => {
  const source = "## 标题\n\n原来的段落\n\n```ts\nconst a = 1;\n\nconst b = 2;\n```\n\n[链接][ref]\n\n[ref]: https://example.com\n";
  function Harness() { const [value, set] = useState(source); return <><LiveManuscript source={value} onChange={set} onSelection={() => {}} wikiLinks={{}} disabled={false} handleRef={null} /><output data-testid="source">{value}</output><button>离开编辑</button></>; }
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "编辑第 2 段" }));
  fireEvent.change(screen.getByLabelText("编辑当前段落"), { target: { value: "改好的 **段落**\n\n又补充一段。" } });
  expect(screen.getByTestId("source").textContent).toBe(source.replace("原来的段落", "改好的 **段落**\n\n又补充一段。"));
  fireEvent.blur(screen.getByLabelText("编辑当前段落"), { relatedTarget: screen.getByRole("button", { name: "离开编辑" }) });
  expect(screen.getByText("段落", { selector: "strong" })).toBeVisible();
  expect(screen.getByRole("link", { name: "链接" })).toHaveAttribute("href", "https://example.com");
});
