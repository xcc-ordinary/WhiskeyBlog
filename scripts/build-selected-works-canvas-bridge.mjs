import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const desktopCanvasPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const destination = `${root}/public/images/site-backgrounds`;

if (!desktopCanvasPath) {
  throw new Error("Usage: node scripts/build-selected-works-canvas-bridge.mjs <source-image>");
}

async function build({ width, height, canvasPath, outputPath }) {
  await sharp(canvasPath)
    .resize({ width, height, fit: "cover", position: "north" })
    .webp({ quality: 82, alphaQuality: 95, effort: 6 })
    .toFile(outputPath);
}

await build({
  width: 1920,
  height: 1080,
  canvasPath: desktopCanvasPath,
  outputPath: `${destination}/selected-works-canvas-fade-v1.webp`,
});

await build({
  width: 1080,
  height: 1920,
  canvasPath: desktopCanvasPath,
  outputPath: `${destination}/selected-works-canvas-fade-mobile-v1.webp`,
});
