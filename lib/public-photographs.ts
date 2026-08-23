import "server-only";

import { createClient } from "@supabase/supabase-js";

import { normalizeDerivativePath } from "@/lib/derivative-paths";
import { getPublishedPhotographs } from "@/lib/supabase/photographs";
import type { Database, PhotographStatus, PublishedPhotograph } from "@/lib/supabase/types";

const SIGNED_DERIVATIVE_URL_SECONDS = 15 * 60;

export type PublicArchivePhotograph = {
  id: string;
  title: string;
  alt: string;
  caption: string | null;
  capturedAt: string | null;
  location: string | null;
  galleryUrl: string;
  displayOrder: number;
};

export type PublicArchiveSourcePhotograph = PublishedPhotograph & { status?: PhotographStatus };

type PublicPhotographOptions = {
  getPublished?: () => Promise<PublicArchiveSourcePhotograph[]>;
  signDerivativeUrl?: (path: string, expiresInSeconds: number) => Promise<string | null>;
};

function requiredServerEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is required to sign public photograph derivatives.`);
  return value;
}

function createPublicArchiveClient() {
  return createClient<Database>(
    requiredServerEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function createDerivativeSigner(client = createPublicArchiveClient()) {
  return async (path: string, expiresInSeconds: number) => {
    const canonicalPath = normalizeDerivativePath(path);
    if (!canonicalPath) return null;
    const objectPath = canonicalPath.slice("derivatives/".length);
    const { data, error } = await client.storage.from("derivatives").createSignedUrl(objectPath, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };
}

function toPublicRecord(photo: PublishedPhotograph, galleryUrl: string): PublicArchivePhotograph {
  return {
    id: photo.id,
    title: photo.title!.trim(),
    alt: photo.alt!.trim(),
    caption: photo.caption,
    capturedAt: photo.capturedAt,
    location: photo.location,
    galleryUrl,
    displayOrder: photo.displayOrder,
  };
}

/**
 * Returns only published metadata plus five-minute links to the gallery derivative.
 * It deliberately has no API for originals, thumbnails, or draft records.
 */
export async function getPublicArchivePhotographs(options: PublicPhotographOptions = {}): Promise<PublicArchivePhotograph[]> {
  const archiveClient = options.getPublished && options.signDerivativeUrl ? null : createPublicArchiveClient();
  const getPublished: () => Promise<PublicArchiveSourcePhotograph[]> = options.getPublished
    ?? (() => getPublishedPhotographs(archiveClient!));
  const signDerivativeUrl = options.signDerivativeUrl ?? createDerivativeSigner(archiveClient!);

  try {
    const photographs = await getPublished();
    const safePublished = photographs.filter((photo) =>
      (photo.status === undefined || photo.status === "published")
      && Boolean(photo.galleryPath && normalizeDerivativePath(photo.galleryPath) && photo.title?.trim() && photo.alt?.trim()),
    );

    const signed = await Promise.all(
      safePublished.map(async (photo) => {
        const canonicalPath = normalizeDerivativePath(photo.galleryPath!);
        if (!canonicalPath) return null;
        const galleryUrl = await signDerivativeUrl(canonicalPath, SIGNED_DERIVATIVE_URL_SECONDS);
        return galleryUrl ? toPublicRecord(photo, galleryUrl) : null;
      }),
    );

    return signed.filter((photo): photo is PublicArchivePhotograph => photo !== null);
  } catch (error) {
    console.error("Public photograph archive is unavailable.", error);
    return [];
  }
}
