"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { publishStudioPhotograph, savePhotographDraft, unpublishStudioPhotograph } from "@/app/studio/actions";
import type { Photograph } from "@/lib/supabase/types";

function dateInputValue(value: string | null) { return value ? value.slice(0, 10) : ""; }

export function PhotographEditor({ photograph }: { photograph: Photograph }) {
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
    const result = photograph.status === "published" ? await unpublishStudioPhotograph(photograph.id) : await publishStudioPhotograph(photograph.id);
    setIsWorking(false); setMessage(result.message ?? "操作已完成。");
    if (result.ok) router.refresh();
  }

  return <form action={save} className="studio-editor">
    <header className="studio-editor-heading"><div><p className="studio-kicker">{photograph.status === "draft" ? "DRAFT / METADATA" : "PUBLISHED / METADATA"}</p><h1>{photograph.title ?? "未命名照片"}</h1><p>原图保持私密。填写清楚的替代文本后，才能将衍生图作为公开作品发布。</p></div><button className="studio-secondary-button" disabled={isWorking} onClick={changePublication} type="button">{photograph.status === "published" ? "撤回发布" : "发布照片"}</button></header>
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
    <section className="studio-derivatives"><p className="studio-kicker">PUBLIC DERIVATIVES / STEP 02</p><h2>公开衍生图路径</h2><p>自动生成衍生图将在下一阶段接入。当前请在 Supabase 的私密 <code>derivatives</code> bucket 手动上传优化版本，并填入对象路径；这三项均为发布前置条件。</p><div className="studio-editor-grid"><label>缩略图路径<input defaultValue={photograph.thumbnailPath ?? ""} name="thumbnailPath" placeholder="owner/photo-thumbnail.jpg" /></label><label>画廊图路径<input defaultValue={photograph.galleryPath ?? ""} name="galleryPath" placeholder="owner/photo-gallery.jpg" /></label><label>详情图路径<input defaultValue={photograph.detailPath ?? ""} name="detailPath" placeholder="owner/photo-detail.jpg" /></label></div></section>
    <div className="studio-editor-actions"><button className="studio-button" disabled={isWorking} type="submit">{isWorking ? "正在保存…" : "保存草稿"}</button>{message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}</div>
  </form>;
}
