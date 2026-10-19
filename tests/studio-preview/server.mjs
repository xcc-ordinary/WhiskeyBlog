// Component-only visual QA: no production routes or authentication bypasses.
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, readdirSync } from "node:fs";
const root = fileURLToPath(new URL("../../", import.meta.url));
const mocks = path.join(root, "tests/studio-preview/mocks.jsx");
let fontCss = "";
try {
  for (const file of readdirSync(path.join(root, ".next/static/chunks")).filter(file => file.endsWith(".css"))) {
    const css = readFileSync(path.join(root, ".next/static/chunks", file), "utf8");
    fontCss += (css.match(/@font-face\{[^}]+\}/g) ?? []).join("\n").replaceAll("../media/", "/qa-fonts/");
  }
} catch { /* Fonts use the documented fallback if there is no prior Next build. */ }
fontCss += ':root{--font-edition-display:"Bodoni Moda";--font-noto-serif:"Noto Serif SC";--font-inter:Inter;--font-lora:Lora}';
const server = await createServer({
  root: path.join(root, "tests/studio-preview"), publicDir: path.join(root, "public"),
  esbuild: { jsx: "automatic" },
  resolve: { alias: [
    { find: /^next\/navigation$/, replacement: mocks },
    { find: /^next\/link$/, replacement: path.join(root, "tests/studio-preview/link.jsx") },
    { find: /^next\/image$/, replacement: path.join(root, "tests/studio-preview/image.jsx") },
    { find: /^@\/app\/studio\/(?:writing\/actions|projects\/actions|actions|markdown-preview-actions)$/, replacement: mocks },
    { find: "@", replacement: root },
  ] },
  plugins: [{ name: "qa-fonts", configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url === "/qa-fonts.css") { response.setHeader("Content-Type", "text/css"); response.end(fontCss); return; }
      if (request.url?.startsWith("/qa-fonts/") && /^[a-z0-9_.-]+\.woff2$/i.test(request.url.slice(10))) {
        try { response.setHeader("Content-Type", "font/woff2"); response.end(readFileSync(path.join(root, ".next/static/media", request.url.slice(10)))); } catch { response.statusCode = 404; response.end(); }
        return;
      }
      next();
    });
  } }],
  server: { host: "127.0.0.1", port: 3104, strictPort: true, fs: { allow: [root] } },
});
await server.listen();
console.log("Studio visual QA: http://127.0.0.1:3104");
