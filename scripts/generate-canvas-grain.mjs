import sharp from "sharp";

const size = 256;
const pixels = Buffer.alloc(size * size * 4);

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const u = (x / size) * Math.PI * 2;
    const v = (y / size) * Math.PI * 2;
    const grain = (
      Math.sin(u * 37 + v * 19) * 0.34
      + Math.cos(u * 23 - v * 41) * 0.25
      + Math.sin(u * 71 + v * 53) * 0.16
      + Math.cos(u * 11 + v * 7) * 0.25
    );
    const value = Math.round(128 + grain * 44);
    const offset = (y * size + x) * 4;
    pixels[offset] = value + 8;
    pixels[offset + 1] = value + 2;
    pixels[offset + 2] = value - 7;
    pixels[offset + 3] = 255;
  }
}

await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile("public/images/site-backgrounds/canvas-grain.png");
