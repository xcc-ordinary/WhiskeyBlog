import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import { requireOwner } from "@/lib/supabase/auth";

vi.mock("@/lib/supabase/auth", () => ({ requireOwner: vi.fn() }));
afterEach(() => vi.clearAllMocks());

describe("renderStudioMarkdown", () => {
  it("renders the public article components including real lists, links and code blocks", async () => {
    vi.mocked(requireOwner).mockResolvedValue({ id: "owner", email: "owner@example.test" });
    const content = await renderStudioMarkdown("# 标题\n\n## 功能\n\n- **双语**\n- [项目](https://example.test)\n\n```ts\nconst x = 1;\n```");
    const html = renderToStaticMarkup(content);
    expect(html).toContain('id="功能"');
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>双语</strong>");
    expect(html).toContain('class="article-link"');
    expect(html).toContain('class="article-code-block"');
    expect(html).not.toContain("<h1>");
  });

  it("requires owner authentication before compiling content", async () => {
    vi.mocked(requireOwner).mockRejectedValueOnce(new Error("Sign in required"));
    await expect(renderStudioMarkdown("## private")).rejects.toThrow("Sign in required");
  });
});
