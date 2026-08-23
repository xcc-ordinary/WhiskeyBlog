"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { quickPublishStudioPhotograph, savePhotographDraft, unpublishStudioPhotograph } from "@/app/studio/actions";
import type { Photograph } from "@/lib/supabase/types";

function dateInputValue(value: string | null) { return value ? value.slice(0, 10) : ""; }

type EditablePhotograph = Photograph & { previewUrl?: string | null };

export function PhotographEditor({ photograph }: { photograph: EditablePhotograph }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function save(formData: FormData) {
    setIsWorking(true); setMessage(null);
    const result = await savePhotographDraft(photograph.id, formData);
    setIsWorking(false); setMessage(result.message ?? "草稿已保存。");
    if (result.ok) router.refresh();
  }

  async function changePublication() {
    setIsWorking(true); setMessage(null);
    const result = photograph.status === "published" ? await unpublishStudioPhotograph(photograph.id) : await quickPublishStudioPhotograph(photograph.id);
    setIsWorking(false); setMessage(result.message ?? "操作已完成。");
    if (result.ok) router.refresh();
  }

  return <form action={save} className="studio-editor">
    <header className="studio-editor-heading"><div><p className="studio-kicker">{photograph.status === "draft" ? "DRAFT / PHOTO" : "PUBLISHED / PHOTO"}</p><h1>{photograph.title ?? "未命名照片"}</h1><p>编辑照片信息、公开展示顺序与画面裁切；原图始终保留在私密存储中。</p></div><div className="studio-editor-heading-actions"><Link className="studio-sign-out" href="/studio#photographs">返回照片资料库</Link><button className="studio-secondary-button" disabled={isWorking} onClick={changePublication} type="button">{photograph.status === "published" ? "撤回公开展示" : "发布到公开展示"}</button></div></header>
    {photograph.previewUrl ? <figure className="studio-photo-preview"><Image alt={photograph.alt ?? photograph.title ?? "照片预览"} fill sizes="(max-width: 700px) 100vw, 50vw" src={photograph.previewUrl} unoptimized /></figure> : null}
    <div className="studio-original-note"><span>PRIVATE ORIGINAL</span><code>{photograph.originalPath}</code></div>
    <div className="studio-editor-grid">
      <label>标题<input defaultValue={photograph.title ?? ""} name="title" placeholder="例如：雨后的河岸" /></label>
      <label>替代文本 <span aria-hidden="true">*</span><input defaultValue={photograph.alt ?? ""} name="alt" placeholder="描述画面内容，方便屏幕阅读器理解" required /></label>
      <label>拍摄日期<input defaultValue={dateInputValue(photograph.capturedAt)} name="capturedAt" type="date" /></label>
      <label>地点<input defaultValue={photograph.location ?? ""} name="location" placeholder="城市 / 地点" /></label>
      <label>分类<input defaultValue={photograph.category ?? ""} name="category" placeholder="旅行、日常、建筑…" /></label>
      <label>展示排序<input defaultValue={photograph.displayOrder} min="0" name="displayOrder" type="number" /></label>
      <label className="studio-wide-field">说明<textarea defaultValue={photograph.caption ?? ""} name="caption" placeholder="可选：记录这个瞬间。" rows={4} /></label>
      <label className="studio-wide-field">裁切参数 <input defaultValue={JSON.stringify(photograph.crop)} name="crop" placeholder='例如 {"x":0.5,"y":0.5}' /><span className="studio-field-hint">可选，使用标准化坐标的 JSON 对象。</span></label>
    </div>
    <section className="studio-display-settings" aria-labelledby="display-settings-title"><div><p className="studio-kicker">PUBLIC DISPLAY</p><h2 id="display-settings-title">照片展示设置</h2><p>排序数字越小越靠前。三种路径用于首页画廊、档案列表与详情展示，保存时会完整保留。</p></div><div className="studio-editor-grid"><label>缩略图路径<input defaultValue={photograph.thumbnailPath ?? ""} name="thumbnailPath" placeholder="owner/photo-id/thumbnail.jpg" /></label><label>画廊图路径<input defaultValue={photograph.galleryPath ?? ""} name="galleryPath" placeholder="owner/photo-id/gallery.jpg" /></label><label className="studio-wide-field">详情图路径<input defaultValue={photograph.detailPath ?? ""} name="detailPath" placeholder="owner/photo-id/detail.jpg" /></label></div></section>
    <div className="studio-editor-actions"><button className="studio-button" disabled={isWorking} type="submit">{isWorking ? "正在保存…" : "保存照片信息"}</button>{message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}</div>
  </form>;
}
