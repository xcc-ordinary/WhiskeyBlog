import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isDerivativePath, normalizeDerivativePath } from "@/lib/derivative-paths";
import { requireOwner } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Database,
  Photograph,
  PhotographCrop,
  PhotographRow,
  PublishedPhotograph,
  PublishedPhotographRow,
} from "@/lib/supabase/types";

type PhotographClient = SupabaseClient<Database>;
export type StudioPhotograph = Photograph & { previewUrl: string | null };

const publishedFields =
  "id, thumbnail_path, gallery_path, detail_path, title, alt, caption, captured_at, location, category, display_order, published_at";

export interface CreateDraftPhotographInput {
  originalPath: string;
}

export interface UpdatePhotographInput {
  title?: string | null;
  alt?: string | null;
  caption?: string | null;
  capturedAt?: string | null;
  location?: string | null;
  category?: string | null;
  displayOrder?: number;
  crop?: PhotographCrop;
  thumbnailPath?: string | null;
  galleryPath?: string | null;
  detailPath?: string | null;
}

type PublishablePhotograph = Pick<Photograph, "title" | "alt" | "thumbnailPath" | "galleryPath" | "detailPath">;

/** Returns the owner-facing reason a draft cannot be published, or null when it is ready. */
export function getPublishValidationError(photograph: PublishablePhotograph): string | null {
  if (!photograph.title?.trim() || !photograph.alt?.trim()) {
    return "请先补充照片标题和替代文本。";
  }

  if (!photograph.thumbnailPath || !photograph.galleryPath || !photograph.detailPath) {
    return "请先填写三种公开衍生图路径。";
  }

  if (![photograph.thumbnailPath, photograph.galleryPath, photograph.detailPath].every(isDerivativePath)) {
    return "公开衍生图路径必须是 derivatives bucket 内的对象路径。";
  }

  return null;
}

function mapPhotograph(row: PhotographRow): Photograph {
  return {
    id: row.id,
    originalPath: row.original_path,
    thumbnailPath: row.thumbnail_path,
    galleryPath: row.gallery_path,
    detailPath: row.detail_path,
    title: row.title,
    alt: row.alt,
    caption: row.caption,
    capturedAt: row.captured_at,
    location: row.location,
    category: row.category,
    displayOrder: row.display_order,
    crop: row.crop,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

function mapPublishedPhotograph(row: PublishedPhotographRow): PublishedPhotograph {
  return {
    id: row.id,
    thumbnailPath: row.thumbnail_path,
    galleryPath: row.gallery_path,
    detailPath: row.detail_path,
    title: row.title,
    alt: row.alt,
    caption: row.caption,
    capturedAt: row.captured_at,
    location: row.location,
    category: row.category,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(`Supabase photograph query failed: ${error.message}`);
  }
}

function requireData<T>(data: T | null): T {
  if (data === null) {
    throw new Error("Supabase photograph query returned no record.");
  }

  return data;
}

/** Returns only the published projection, which cannot expose original file paths. */
export async function getPublishedPhotographs(client?: PhotographClient): Promise<PublishedPhotograph[]> {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase
    .from("published_photographs")
    .select(publishedFields)
    .order("display_order", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapPublishedPhotograph);
}

export async function getOwnerPhotographs(client?: PhotographClient): Promise<Photograph[]> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data, error } = await supabase.from("photographs").select("*").order("created_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapPhotograph);
}

export async function createDraftPhotograph(
  input: CreateDraftPhotographInput,
  client?: PhotographClient,
): Promise<Photograph> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data, error } = await supabase
    .from("photographs")
    .insert({ original_path: input.originalPath })
    .select()
    .single();

  throwIfError(error);
  return mapPhotograph(requireData(data));
}

function mapUpdate(input: UpdatePhotographInput): Database["public"]["Tables"]["photographs"]["Update"] {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.alt !== undefined ? { alt: input.alt } : {}),
    ...(input.caption !== undefined ? { caption: input.caption } : {}),
    ...(input.capturedAt !== undefined ? { captured_at: input.capturedAt } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.displayOrder !== undefined ? { display_order: input.displayOrder } : {}),
    ...(input.crop !== undefined ? { crop: input.crop } : {}),
    ...(input.thumbnailPath !== undefined ? { thumbnail_path: input.thumbnailPath } : {}),
    ...(input.galleryPath !== undefined ? { gallery_path: input.galleryPath } : {}),
    ...(input.detailPath !== undefined ? { detail_path: input.detailPath } : {}),
  };
}

export async function updatePhotograph(
  id: string,
  input: UpdatePhotographInput,
  client?: PhotographClient,
): Promise<Photograph> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data, error } = await supabase.from("photographs").update(mapUpdate(input)).eq("id", id).select().single();

  throwIfError(error);
  return mapPhotograph(requireData(data));
}

export async function publishPhotograph(id: string, client?: PhotographClient): Promise<Photograph> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data: existing, error: existingError } = await supabase.from("photographs").select("*").eq("id", id).single();

  throwIfError(existingError);
  const validationError = getPublishValidationError(mapPhotograph(requireData(existing)));
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase
    .from("photographs")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  throwIfError(error);
  return mapPhotograph(requireData(data));
}

export async function unpublishPhotograph(id: string, client?: PhotographClient): Promise<Photograph> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data, error } = await supabase
    .from("photographs")
    .update({ status: "draft", published_at: null })
    .eq("id", id)
    .select()
    .single();

  throwIfError(error);
  return mapPhotograph(requireData(data));
}

/** Returns owner-only signed previews without exposing a permanent original URL. */
export async function getStudioPhotographs(client?: PhotographClient): Promise<StudioPhotograph[]> {
  const supabase = client ?? (await createSupabaseServerClient());
  const photographs = await getOwnerPhotographs(supabase);
  return Promise.all(photographs.map(async (photograph) => {
    const derivative = normalizeDerivativePath(photograph.galleryPath ?? photograph.thumbnailPath);
    const bucket = derivative ? "derivatives" : "originals";
    const objectPath = derivative ? derivative.slice("derivatives/".length) : photograph.originalPath;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
    return { ...photograph, previewUrl: error ? null : data?.signedUrl ?? null };
  }));
}

/** Permanently removes an owner photograph record and its private source/display files. */
export async function deletePhotograph(id: string, client?: PhotographClient): Promise<void> {
  const supabase = client ?? (await createSupabaseServerClient());
  await requireOwner(supabase);
  const { data: existing, error: existingError } = await supabase.from("photographs").select("*").eq("id", id).single();
  throwIfError(existingError);
  const photograph = mapPhotograph(requireData(existing));
  const { error } = await supabase.from("photographs").delete().eq("id", id);
  throwIfError(error);

  // Only remove display objects created for this photo. Older manually-managed
  // derivative paths may be shared by several records and must not be removed here.
  const managedPrefix = `owner/${id}/`;
  const derivativePaths = [photograph.thumbnailPath, photograph.galleryPath, photograph.detailPath]
    .map(normalizeDerivativePath)
    .filter((path): path is string => path !== null)
    .map((path) => path.slice("derivatives/".length));
  await supabase.storage.from("originals").remove([photograph.originalPath]);
  const managedDerivativePaths = derivativePaths.filter((path) => path.startsWith(managedPrefix));
  if (managedDerivativePaths.length) await supabase.storage.from("derivatives").remove([...new Set(managedDerivativePaths)]);
}
