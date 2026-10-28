import { createPublicArchiveClient } from "@/lib/public-photographs";
import { normalizeDerivativePath } from "@/lib/derivative-paths";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

/** Stable URL, fresh publication check, no signed URLs or originals in responses. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 404, headers });
  try {
    const client = createPublicArchiveClient();
    const { data, error } = await client.from("published_photographs").select("gallery_path").eq("id", id).maybeSingle();
    if (error) return new Response(null, { status: 503, headers });
    const path = normalizeDerivativePath(data?.gallery_path);
    if (!path) return new Response(null, { status: 404, headers });
    const { data: image, error: downloadError } = await client.storage.from("derivatives").download(path.slice("derivatives/".length));
    if (downloadError || !image) return new Response(null, { status: 503, headers });
    if (image.size > 20 * 1024 * 1024) return new Response(null, { status: 503, headers });
    // Also sanitize legacy "derivatives" that were byte-for-byte original copies.
    const bytes = await sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch {
    console.error("Public photograph delivery failed.");
    return new Response(null, { status: 503, headers });
  }
}
