import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import { MarkdownPreview } from "@/components/studio/markdown-preview";

vi.mock("@/app/studio/markdown-preview-actions", () => ({ renderStudioMarkdown: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

describe("MarkdownPreview", () => {
  it("debounces typing and ignores stale rendering responses", async () => {
    vi.useFakeTimers();
    let finishOld: (value: React.ReactElement) => void = () => {};
    vi.mocked(renderStudioMarkdown).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
    const { rerender } = render(<MarkdownPreview source="old" />);
    await act(() => vi.advanceTimersByTimeAsync(450));
    vi.mocked(renderStudioMarkdown).mockResolvedValueOnce(<div className="prose"><h2>最新版</h2><pre>代码块</pre></div>);
    rerender(<MarkdownPreview source="new" />);
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(screen.getByRole("heading", { name: "最新版" })).toBeInTheDocument();
    await act(async () => finishOld(<p>过时的预览</p>));
    expect(screen.queryByText("过时的预览")).not.toBeInTheDocument();
    expect(renderStudioMarkdown).toHaveBeenLastCalledWith("new");
  });

  it("reports invalid MDX without clearing the editor source", async () => {
    vi.useFakeTimers();
    vi.mocked(renderStudioMarkdown).mockRejectedValueOnce(new Error("invalid syntax"));
    render(<MarkdownPreview source="<invalid" />);
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(screen.getByRole("status")).toHaveTextContent("检查 Markdown / MDX 语法");
  });
});
