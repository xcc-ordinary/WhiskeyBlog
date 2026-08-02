"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createOriginalUploadIntent, createUploadedDraft } from "@/app/studio/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UploadDrawer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setMessage("请先选择一张图片。"); return; }
    setIsUploading(true); setProgress(10); setMessage("正在准备私密上传…");
    const intent = await createOriginalUploadIntent({ name: file.name, size: file.size, type: file.type });
    if (!intent.ok || !intent.path || !intent.token) { setIsUploading(false); setProgress(null); setMessage(intent.message ?? "无法准备上传，请稍后重试。"); return; }

    setProgress(35); setMessage("正在上传原图…");
    const { error } = await createSupabaseBrowserClient().storage.from("originals").uploadToSignedUrl(intent.path, intent.token, file, { contentType: file.type });
    if (error) { setIsUploading(false); setProgress(null); setMessage("上传中断了；你的照片尚未建立草稿，可以重新尝试。"); return; }

    setProgress(85); setMessage("正在建立照片草稿…");
    const draft = await createUploadedDraft(intent.path);
    setIsUploading(false); setProgress(draft.ok ? 100 : null);
    if (!draft.ok || !draft.photographId) { setMessage(draft.message ?? "无法创建照片草稿，请稍后重试。"); return; }
    router.push(`/studio/${draft.photographId}`);
    router.refresh();
  }

  return <>
    <button className="studio-button" onClick={() => { setMessage(null); setProgress(null); setIsOpen(true); }} type="button">上传照片</button>
    {isOpen ? <div aria-labelledby="upload-drawer-title" aria-modal="true" className="studio-drawer-backdrop" onMouseDown={() => !isUploading && setIsOpen(false)} role="dialog">
      <section className="studio-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <p className="studio-kicker">PRIVATE ORIGINAL / STEP 01</p>
        <h2 id="upload-drawer-title">上传一张新照片</h2>
        <p>原图会存入私密存储，上传不会自动公开。接下来你可以编辑资料，再决定是否发布。</p>
        <label className="studio-file-input" htmlFor="studio-image">选择图片 <input accept="image/jpeg,image/png,image/webp,image/avif" disabled={isUploading} id="studio-image" onChange={() => setMessage(null)} ref={inputRef} type="file" /></label>
        <p className="studio-field-hint">支持 JPG、PNG、WebP、AVIF，单张不超过 20 MB。</p>
        <div className="studio-drawer-actions"><button className="studio-button" disabled={isUploading} onClick={upload} type="button">{isUploading ? "正在上传…" : "创建草稿"}</button><button className="studio-secondary-button" disabled={isUploading} onClick={() => setIsOpen(false)} type="button">取消</button></div>
        {progress !== null ? <progress aria-label="上传进度" className="studio-upload-progress" max="100" value={progress}>{progress}%</progress> : null}
        {message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}
      </section>
    </div> : null}
  </>;
}
