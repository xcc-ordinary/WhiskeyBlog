// @vitest-environment node
import { expect, it } from "vitest";
import sharp from "sharp";
import { createPhotographDerivatives } from "@/lib/photograph-derivatives";

it("generates three bounded WebP images with source metadata removed", async () => {
  const source = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#243743" } })
    .withMetadata({ orientation: 6 }).jpeg().toBuffer();
  expect((await sharp(source).metadata()).exif).toBeDefined();
  const images = await createPhotographDerivatives(source);
  expect(images.map(image => image.kind)).toEqual(["thumbnail", "gallery", "detail"]);
  for (const [index, image] of images.entries()) {
    const meta = await sharp(image.bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width!, meta.height!)).toBe([480, 1600, 2560][index]);
    expect(meta.height).toBeGreaterThan(meta.width!);
    expect(meta.exif).toBeUndefined();
    expect(meta.icc).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  }
});

it("rejects invalid image bytes rather than publishing the source", async () => {
  await expect(createPhotographDerivatives(Buffer.from("not a photograph"))).rejects.toThrow();
});
