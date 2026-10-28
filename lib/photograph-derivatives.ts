import "server-only";
import sharp from "sharp";

/** Re-encode pixels only: Sharp strips EXIF/GPS and other source metadata. */
export async function createPhotographDerivatives(original: Buffer) {
  const image = sharp(original, { limitInputPixels: 40_000_000, failOn: "warning" }).rotate();
  const sizes = { thumbnail: 480, gallery: 1600, detail: 2560 } as const;
  return Promise.all(Object.entries(sizes).map(async ([kind, width]) => ({
    kind: kind as keyof typeof sizes,
    bytes: await image.clone().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
  })));
}
