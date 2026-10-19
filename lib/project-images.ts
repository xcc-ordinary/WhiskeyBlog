export const maxProjectImageBytes = 3.75 * 1024 * 1024;
export const projectImageAccept = "image/jpeg,image/png,image/webp,image/gif";

export type ProjectCoverFit = "cover" | "contain";

/** Image sources supported by the site's CSP and Next image configuration. */
export function isSupportedDocumentCover(value: string): boolean {
  if (/^\/(?!\/)/.test(value) && !/[\\\u0000-\u001f]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.port && !url.username && !url.password && /^\/storage\/v1\/object\/(?:public\/content-images|sign\/derivatives)\//.test(url.pathname);
  } catch { return false; }
}

export function validProjectCoverPosition(value: string): boolean {
  if (value === "center") return true;
  const coordinates = value.match(/^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/);
  return !!coordinates && coordinates.slice(1).every(coordinate => Number(coordinate) <= 100);
}

/** Covers may use site images or the public Studio illustration bucket. */
export function firstProjectBodyImage(source: string): { src: string; alt: string } | undefined {
  const prose = source.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "").replace(/`[^`\n]+`/g, "");
  for (const match of prose.matchAll(/!\[([^\]]*)\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g)) {
    const src = match[2].replace(/^<|>$/g, "");
    if (/^\/(?:images|project-media)\//.test(src) && !src.includes("..")) return { src, alt: match[1] };
    try {
      const url = new URL(src);
      if (url.protocol === "https:" && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.username && !url.password && url.pathname.startsWith("/storage/v1/object/public/content-images/")) return { src, alt: match[1] };
    } catch { /* Relative or unsupported paths are not cover candidates. */ }
  }
  return undefined;
}

// Derive the extension from the bytes, never from an uploaded filename.
export function projectImageExtension(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (["GIF87a", "GIF89a"].includes(text(0, 6))) return "gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "webp";
  return null;
}
