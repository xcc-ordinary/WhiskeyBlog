"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDraftPhotograph, deletePhotograph, publishPhotograph, unpublishPhotograph, updatePhotograph, type UpdatePhotographInput } from "@/lib/supabase/photographs";
import type { PhotographCrop } from "@/lib/supabase/types";
import { extensionForUploadType, getUploadValidationError, isManagedOriginalPath, type UploadFileDetails } from "@/lib/supabase/upload";
import { requireOwner } from "@/lib/supabase/auth";

type ActionResult = { ok: true; message?: string; photographId?: string } | { ok: false; message: string };

function actionError(error: unknown): ActionResult {
  return { ok: false, message: error instanceof Error ? error.message : "操作未能完成，请稍后重试。" };
}

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cropFrom(value: string | null): PhotographCrop {
  if (!value?.trim()) return {};
  try {
    const crop = JSON.parse(value) as unknown;
    if (!crop || typeof crop !== "object" || Array.isArray(crop)) throw new Error();
    return crop as PhotographCrop;
  } catch {
    throw new Error("裁切参数应为 JSON 对象，例如 {\"x\": 0.5, \"y\": 0.5}。");
  }
}

export async function signOutOfStudio() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/studio/login");
}

/** Authorizes one short-lived upload to the private originals bucket. */
export async function createOriginalUploadIntent(file: UploadFileDetails): Promise<ActionResult & { path?: string; token?: string }> {
  const validationError = getUploadValidationError(file);
  if (validationError) return { ok: false, message: validationError };

  try {
    const supabase = await createSupabaseServerClient();
    await requireOwner(supabase);
    const extension = extensionForUploadType(file.type);
    if (!extension) return { ok: false, message: "不支持的图片格式。" };
    const path = `owner/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from("originals").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, message: "无法准备上传，请稍后重试。" };
    return { ok: true, path, token: data.token };
  } catch (error) {
    return actionError(error);
  }
}

/** Creates a draft only after the browser finished its private-storage upload. */
export async function createUploadedDraft(originalPath: string): Promise<ActionResult> {
  if (!isManagedOriginalPath(originalPath)) return { ok: false, message: "无效的原图路径。" };
  try {
    const supabase = await createSupabaseServerClient();
    await requireOwner(supabase);
    const { data: existing, error: existingError } = await supabase
      .from("photographs")
      .select("id")
      .eq("original_path", originalPath)
      .maybeSingle();
    if (existingError) return { ok: false, message: "无法确认草稿状态，请稍后重试。" };
    if (existing) return { ok: true, photographId: existing.id };

    const fileName = originalPath.slice("owner/".length);
    const { data: objects, error: objectError } = await supabase.storage.from("originals").list("owner", { search: fileName });
    if (objectError || !objects?.some((object) => object.name === fileName)) {
      return { ok: false, message: "未找到刚才上传的原图；请重新上传。" };
    }
    const photograph = await createDraftPhotograph({ originalPath });
    return { ok: true, photographId: photograph.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function savePhotographDraft(id: string, form: FormData): Promise<ActionResult> {
  try {
    const displayOrder = Number(form.get("displayOrder") ?? 0);
    if (!Number.isFinite(displayOrder) || displayOrder < 0) return { ok: false, message: "展示排序必须是大于或等于 0 的数字。" };
    const update: UpdatePhotographInput = {
      title: text(form.get("title") as string | null), alt: text(form.get("alt") as string | null),
      capturedAt: text(form.get("capturedAt") as string | null), location: text(form.get("location") as string | null),
      category: text(form.get("category") as string | null), caption: text(form.get("caption") as string | null),
      displayOrder, crop: cropFrom(form.get("crop") as string | null),
      ...(form.has("thumbnailPath") ? { thumbnailPath: text(form.get("thumbnailPath") as string | null) } : {}),
      ...(form.has("galleryPath") ? { galleryPath: text(form.get("galleryPath") as string | null) } : {}),
      ...(form.has("detailPath") ? { detailPath: text(form.get("detailPath") as string | null) } : {}),
    };
    await updatePhotograph(id, update);
    return { ok: true, message: "草稿已保存。" };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishStudioPhotograph(id: string): Promise<ActionResult> {
  try {
    await publishPhotograph(id);
    return { ok: true, message: "照片已发布。" };
  } catch (error) {
    return actionError(error);
  }
}

export async function unpublishStudioPhotograph(id: string): Promise<ActionResult> {
  try {
    await unpublishPhotograph(id);
    return { ok: true, message: "照片已撤回为草稿。" };
  } catch (error) {
    return actionError(error);
  }
}

/** Prepares a private display copy, fills missing basic metadata, then publishes. */
export async function quickPublishStudioPhotograph(id: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    await requireOwner(supabase);
    const { data, error } = await supabase.from("photographs").select("*").eq("id", id).single();
    if (error || !data) return { ok: false, message: "未找到这张照片。" };

    const extension = data.original_path.match(/\.([a-z0-9]+)$/i)?.[1];
    if (!extension) return { ok: false, message: "无法识别原图格式。" };
    const displayPath = `owner/${id}/display.${extension}`;
    if (!data.thumbnail_path || !data.gallery_path || !data.detail_path) {
      const { data: original, error: downloadError } = await supabase.storage.from("originals").download(data.original_path);
      if (downloadError || !original) return { ok: false, message: "无法读取私密原图，请稍后重试。" };
      const { error: uploadError } = await supabase.storage.from("derivatives").upload(displayPath, original, { contentType: original.type || undefined, upsert: true });
      if (uploadError) return { ok: false, message: "无法准备展示图片，请稍后重试。" };
    }

    await updatePhotograph(id, {
      title: data.title?.trim() || "未命名照片",
      alt: data.alt?.trim() || data.title?.trim() || "上传的摄影作品",
      thumbnailPath: data.thumbnail_path || displayPath,
      galleryPath: data.gallery_path || displayPath,
      detailPath: data.detail_path || displayPath,
    }, supabase);
    await publishPhotograph(id, supabase);
    return { ok: true, message: "照片已发布到公开档案。" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteStudioPhotograph(id: string): Promise<ActionResult> {
  try {
    await deletePhotograph(id);
    return { ok: true, message: "照片已删除。" };
  } catch (error) {
    return actionError(error);
  }
}
