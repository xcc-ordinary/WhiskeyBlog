import { describe, expect, it } from "vitest";

import { estimateReadingMinutes, extractArticleHeadings, headingId } from "@/lib/article";

describe("article reading helpers", () => {
  it("builds the same stable multilingual anchor shape used by MDX headings", () => {
    expect(headingId("3. 登录与计费方式？")).toBe("3-登录与计费方式");
  });

  it("extracts level-two and level-three headings while ignoring the article title", () => {
    const source = "# 标题\n\n## 开始 [这里](/start)\n\n### `CLI` 工作流\n";
    expect(extractArticleHeadings(source)).toEqual([
      { id: "开始-这里", level: 2, text: "开始 这里" },
      { id: "cli-工作流", level: 3, text: "CLI 工作流" },
    ]);
  });

  it("never reports a zero-minute article", () => {
    expect(estimateReadingMinutes("很短的一篇文章")).toBe(1);
  });
});
