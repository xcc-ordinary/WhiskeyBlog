import sharp from "sharp";

const root = process.cwd();
const desktopCanvasPath = "C:/Users/16617/.codex/generated_images/01a0152f-ee8a-7df0-b227-1a8d2f6f19bc/exec-d0b869d5-af00-4050-a03c-146cc983b11c.png";
const destination = `${root}/public/images/site-backgrounds`;

async function build({ width, height, canvasPath, outputPath }) {
  await sharp(canvasPath)
    .resize({ width, height, fit: "cover", position: "north" })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

await build({
  width: 2560,
  height: 1440,
  canvasPath: desktopCanvasPath,
  outputPath: `${destination}/selected-works-canvas-fade-v1.png`,
});

await build({
  width: 1440,
  height: 2560,
  canvasPath: desktopCanvasPath,
  outputPath: `${destination}/selected-works-canvas-fade-mobile-v1.png`,
});
