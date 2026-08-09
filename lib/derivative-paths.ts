const DERIVATIVES_BUCKET = "derivatives";

/**
 * Converts an owner-entered derivative object path into the canonical form used
 * by the public signer. Studio values may be either bucket-relative
 * (`owner/photo.jpg`) or the older `derivatives/owner/photo.jpg` form.
 */
export function normalizeDerivativePath(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const path = value.trim();
  if (!path || path.includes("\\") || path.startsWith("/") || path.includes("//") || path.includes("?") || path.includes("#")) {
    return null;
  }

  // A colon makes this a URL or a scheme-qualified value rather than an
  // object path. The public adapter must never sign another bucket or host.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return null;

  const relativePath = path.startsWith(`${DERIVATIVES_BUCKET}/`)
    ? path.slice(`${DERIVATIVES_BUCKET}/`.length)
    : path;

  if (!relativePath || relativePath.startsWith("originals/")) return null;

  const segments = relativePath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;

  return `${DERIVATIVES_BUCKET}/${relativePath}`;
}

export function isDerivativePath(value: string | null | undefined): boolean {
  return normalizeDerivativePath(value) !== null;
}
