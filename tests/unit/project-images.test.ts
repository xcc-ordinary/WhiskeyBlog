import { describe, expect, it } from "vitest";
import { firstProjectBodyImage, projectImageExtension, validProjectCoverPosition } from "@/lib/project-images";

describe("project image upload signatures", () => {
  it("recognizes supported raster formats from bytes", () => {
    expect(projectImageExtension(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))).toBe("png");
    expect(projectImageExtension(new Uint8Array([255,216,255,0,0,0,0,0,0,0,0,0]))).toBe("jpg");
    expect(projectImageExtension(new TextEncoder().encode("RIFF1234WEBP1234"))).toBe("webp");
    expect(projectImageExtension(new TextEncoder().encode("GIF89a1234567890"))).toBe("gif");
  });
  it("rejects SVG, HTML and short or unrecognized content", () => {
    expect(projectImageExtension(new TextEncoder().encode('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(projectImageExtension(new TextEncoder().encode("<html>fake image</html>"))).toBeNull();
    expect(projectImageExtension(new Uint8Array([137,80]))).toBeNull();
  });
});

describe("automatic project cover", () => {
  it("uses the first supported body image and its description", () => {
    expect(firstProjectBodyImage('![Remote](https://example.com/cover.png)\n![成品](/project-media/cover.png "图示")')).toEqual({ src: "/project-media/cover.png", alt: "成品" });
    expect(firstProjectBodyImage("![图片](</images/projects/my cover.png>)")).toEqual({ src: "/images/projects/my cover.png", alt: "图片" });
  });
  it("ignores examples in code and unsupported or unsafe image routes", () => {
    expect(firstProjectBodyImage('```md\n![Example](/images/example.png)\n```\n`![Inline](/images/inline.png)`\n![Bad](/images/../secret.png)')).toBeUndefined();
  });
  it("accepts only bounded percentage coordinates or center", () => {
    expect(validProjectCoverPosition("50% 94%")).toBe(true);
    expect(validProjectCoverPosition("center")).toBe(true);
    expect(validProjectCoverPosition("0% 100%")).toBe(true);
    expect(validProjectCoverPosition("-1% 50%")).toBe(false);
    expect(validProjectCoverPosition("50% 101%")).toBe(false);
    expect(validProjectCoverPosition("left;display:none")).toBe(false);
  });
});
