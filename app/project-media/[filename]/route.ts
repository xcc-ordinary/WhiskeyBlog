import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
const mediaTypes: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

// A runtime URL lets locally uploaded files work in next start without a rebuild.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const match = filename.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp|gif)$/);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "images", "projects", "uploads", filename));
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": mediaTypes[match[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    throw error;
  }
}
