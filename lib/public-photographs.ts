import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublishedPhotographs } from "@/lib/supabase/photographs";
import type { Database, PublishedPhotograph } from "@/lib/supabase/types";

const SIGNED_DERIVATIVE_URL_SECONDS = 5 * 60;

export type PublicArchivePhotograph = {
  id: string;
  imageUrl: string;
  title: string;
  alt: string;
  caption: string | null;
  capturedAt: string | null;
  location: string | null;
  category: string | null;
  displayOrder: number;
  publishedAt: string;
};

type PublicPhotographOptions = {
  getPublished?: () => Promise<PublishedPhotograph[]>;
  signDerivativeUrl?: (path: string, expiresInSeconds: number) => Promise<string | null>;
};

function requiredServerEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is required to sign public photograph derivatives.`);
  return value;
}

function isSafeDerivativePath(path: string) {
  return path.length > 0 && !path.startsWith("/") && !path.includes("..") && !path.includes("\\");
}

function createDerivativeSigner() {
  const client = createClient<Database>(
    requiredServerEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  return async (path: string, expiresInSeconds: number) => {
    if (!isSafeDerivativePath(path)) return null;
    const { data, error } = await client.storage.from("derivatives").createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };
}

function toPublicRecord(photo: PublishedPhotograph, imageUrl: string): PublicArchivePhotograph {
  return {
    id: photo.id,
    imageUrl,
    title: photo.title!.trim(),
    alt: photo.alt!.trim(),
    caption: photo.caption,
    capturedAt: photo.capturedAt,
    location: photo.location,
    category: photo.category,
    displayOrder: photo.displayOrder,
    publishedAt: photo.publishedAt,
  };
}

/**
 * Returns only published metadata plus five-minute links to the gallery derivative.
 * It deliberately has no API for originals, thumbnails, or draft records.
 */
export async function getPublicArchivePhotographs(options: PublicPhotographOptions = {}): Promise<PublicArchivePhotograph[]> {
  const getPublished = options.getPublished ?? getPublishedPhotographs;
  const signDerivativeUrl = options.signDerivativeUrl ?? createDerivativeSigner();
  const photographs = await getPublished();

  const safePublished = photographs.filter(
    (photo) => Boolean(photo.galleryPath && isSafeDerivativePath(photo.galleryPath) && photo.title?.trim() && photo.alt?.trim()),
  );

  const signed = await Promise.all(
    safePublished.map(async (photo) => {
      const imageUrl = await signDerivativeUrl(photo.galleryPath!, SIGNED_DERIVATIVE_URL_SECONDS);
      return imageUrl ? toPublicRecord(photo, imageUrl) : null;
    }),
  );

  return signed.filter((photo): photo is PublicArchivePhotograph => photo !== null);
}
