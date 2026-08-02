export const MAX_ORIGINAL_UPLOAD_BYTES = 20 * 1024 * 1024;

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type UploadFileDetails = { name: string; size: number; type: string };

export function getUploadValidationError(file: UploadFileDetails): string | null {
  if (!extensionByType[file.type]) return "请选择 JPG、PNG、WebP 或 AVIF 格式的图片。";
  if (!Number.isFinite(file.size) || file.size <= 0) return "请选择一张有效的图片。";
  if (file.size > MAX_ORIGINAL_UPLOAD_BYTES) return "单张照片不能超过 20 MB。";
  return null;
}

export function extensionForUploadType(type: string): string | null {
  return extensionByType[type] ?? null;
}

/** Upload intents always use a random UUID path inside the owner-only originals prefix. */
export function isManagedOriginalPath(path: string): boolean {
  return /^owner\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i.test(path);
}
