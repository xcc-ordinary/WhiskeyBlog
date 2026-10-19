import { describe, it, expect } from "vitest";
import { documentHeaderCover } from "@/lib/project-images";
describe("single image in a reading document", () => {
  it("keeps card metadata but suppresses the same header image already in Markdown or HTML", () => {
    const url = "https://test.supabase.co/storage/v1/object/public/content-images/owner/a.jpg";
    expect(documentHeaderCover(url, `![过程](${url})\n\n正文`)).toBeUndefined();
    expect(documentHeaderCover("/images/a.png", '<img alt="过程" src="/images/a.png" />')).toBeUndefined();
    expect(documentHeaderCover("/images/a.png", "![另一张](/images/b.png)")).toBe("/images/a.png");
  });
  it("does not treat image syntax inside code as a displayed image", () => {
    expect(documentHeaderCover("/images/a.png", "```md\n![例子](/images/a.png)\n```")).toBe("/images/a.png");
  });
});
