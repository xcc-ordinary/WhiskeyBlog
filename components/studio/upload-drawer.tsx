"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createOriginalUploadIntent, createUploadedDraft } from "@/app/studio/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UploadDrawer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    if (!isOpen) triggerRef.current?.focus();
  }, [isOpen]);

  async function createDraft(path: string) {
    setProgress(85); setMessage("正在建立照片草稿…");
    const draft = await createUploadedDraft(path);
    setIsUploading(false); setProgress(draft.ok ? 100 : null);
    if (!draft.ok || !draft.photographId) { setPendingPath(path); setMessage(draft.message ?? "无法创建照片草稿，请稍后重试。"); return; }
    setPendingPath(null);
    router.push(`/studio/${draft.photographId}`);
    router.refresh();
  }

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
    await createDraft(intent.path);
  }

  return <>
    <button className="studio-button" onClick={() => { setMessage(null); setProgress(null); setPendingPath(null); setIsOpen(true); }} ref={triggerRef} type="button">上传照片</button>
    <dialog aria-labelledby="upload-drawer-title" className="studio-drawer-backdrop" onCancel={(event) => { if (isUploading) event.preventDefault(); }} onClose={() => setIsOpen(false)} onMouseDown={(event) => { if (event.target === event.currentTarget && !isUploading) setIsOpen(false); }} ref={dialogRef}>
      <section className="studio-drawer">
        <p className="studio-kicker">PRIVATE ORIGINAL / STEP 01</p>
        <h2 id="upload-drawer-title">上传一张新照片</h2>
        <p>原图会存入私密存储，上传不会自动公开。接下来你可以编辑资料，再决定是否发布。</p>
        <div className="studio-file-input">
          <input accept="image/jpeg,image/png,image/webp,image/avif" aria-describedby="studio-image-hint studio-selected-file" aria-label="选择图片" className="studio-hidden-file-input" disabled={isUploading} id="studio-image" onChange={(event) => { setMessage(null); setSelectedFileName(event.currentTarget.files?.[0]?.name ?? null); }} ref={inputRef} type="file" />
          <button className="studio-secondary-button" disabled={isUploading} onClick={() => inputRef.current?.click()} type="button">选择图片</button>
          <p aria-live="polite" className="studio-selected-file" id="studio-selected-file">{selectedFileName ?? "尚未选择图片"}</p>
        </div>
        <p className="studio-field-hint" id="studio-image-hint">支持 JPG、PNG、WebP、AVIF，单张不超过 20 MB。</p>
        <div className="studio-drawer-actions"><button className="studio-button" disabled={isUploading} onClick={upload} type="button">{isUploading ? "正在上传…" : "创建草稿"}</button><button className="studio-secondary-button" disabled={isUploading} onClick={() => setIsOpen(false)} type="button">取消</button></div>
        {progress !== null ? <progress aria-label="上传进度" className="studio-upload-progress" max="100" value={progress}>{progress}%</progress> : null}
        {message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}
      </section>
      {pendingPath ? <button className="studio-secondary-button" disabled={isUploading} onClick={() => { setIsUploading(true); void createDraft(pendingPath); }} type="button">重试建立草稿</button> : null}
    </dialog>
  </>;
}
