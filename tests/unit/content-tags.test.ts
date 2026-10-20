import { describe, it, expect } from "vitest";
import { footerTags, documentTags, matchesTagQuery } from "@/lib/content-tags";
describe("author-created footer hashtags", () => {
  it("merges metadata and trailing tags, including Chinese and nested categories", () => {
    expect(documentTags(["Design", "随笔"], "正文。\n\n#todo #设计/交互 #design\n")).toEqual(["Design", "随笔", "todo", "设计/交互"]);
    expect(footerTags("正文。\n\n#todo\n\n#生活")).toEqual(["todo", "生活"]);
    expect(matchesTagQuery(["设计/交互"], "#设计")).toBe(true);
  });
  it("does not invent categories from headings, URLs, prose or code examples", () => {
    for (const text of ["# Heading", "正文包含 #todo", "https://example.com/#todo", "```sh\n#todo\n```", "`#todo`", "> #todo"]) expect(footerTags(text)).toEqual([]);
    expect(footerTags("#todo\n\n仍然是正文")).toEqual([]);
  });
});
