"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDraftPhotograph, publishPhotograph, unpublishPhotograph, updatePhotograph } from "@/lib/supabase/photographs";
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
    await updatePhotograph(id, {
      title: text(form.get("title") as string | null), alt: text(form.get("alt") as string | null),
      capturedAt: text(form.get("capturedAt") as string | null), location: text(form.get("location") as string | null),
      category: text(form.get("category") as string | null), caption: text(form.get("caption") as string | null),
      thumbnailPath: text(form.get("thumbnailPath") as string | null), galleryPath: text(form.get("galleryPath") as string | null),
      detailPath: text(form.get("detailPath") as string | null),
      displayOrder: Number(form.get("displayOrder") ?? 0), crop: cropFrom(form.get("crop") as string | null),
    });
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
