"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteStudioPhotograph, quickPublishStudioPhotograph, unpublishStudioPhotograph } from "@/app/studio/actions";
import type { Photograph, PhotographStatus } from "@/lib/supabase/types";
import { UploadDrawer } from "@/components/studio/upload-drawer";

const labels: Record<PhotographStatus, string> = { draft: "草稿", published: "已发布" };
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value)); }
export function PhotographLibrary({ photographs }: { photographs: Photograph[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PhotographStatus>("draft");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const visiblePhotographs = useMemo(() => photographs.filter((photograph) => photograph.status === activeTab), [activeTab, photographs]);
  async function publish(photograph: Photograph) {
    setWorkingId(photograph.id); setMessage(null);
    const result = photograph.status === "published" ? await unpublishStudioPhotograph(photograph.id) : await quickPublishStudioPhotograph(photograph.id);
    setWorkingId(null); setMessage(result.message ?? "操作已完成。");
    if (result.ok) router.refresh();
  }
  async function remove(photograph: Photograph) {
    if (!window.confirm(`确定要永久删除“${photograph.title ?? "未命名照片"}”吗？此操作无法撤销。`)) return;
    setWorkingId(photograph.id); setMessage(null);
    const result = await deleteStudioPhotograph(photograph.id);
    setWorkingId(null); setMessage(result.message ?? "操作已完成。");
    if (result.ok) router.refresh();
  }
  return <section aria-label="照片资料库" className="studio-library">
    <div className="studio-library-toolbar"><p>上传后即可发布；系统会保留私密原图，并自动准备受控展示副本。</p><UploadDrawer /></div>
    <div aria-label="照片状态" className="studio-library-tabs" role="tablist">
      {(["draft", "published"] as const).map((status) => { const count = photographs.filter((photograph) => photograph.status === status).length; return <button aria-selected={activeTab === status} className="studio-tab" key={status} onClick={() => setActiveTab(status)} role="tab" type="button">{labels[status]} <span>{count}</span></button>; })}
    </div>
    <div className="studio-library-list" role="tabpanel">
      {visiblePhotographs.length === 0 ? <div className="studio-empty-state"><p className="studio-kicker">{activeTab === "draft" ? "01 / DRAFTS" : "02 / PUBLISHED"}</p><h2>{activeTab === "draft" ? "还没有待整理的照片。" : "还没有公开的摄影作品。"}</h2><p>上传一张照片，它会先作为私密草稿进入你的档案。</p></div> : visiblePhotographs.map((photograph, index) => <article className="studio-photograph-row" key={photograph.id}><span aria-hidden="true" className="studio-row-number">{String(index + 1).padStart(2, "0")}</span><div><h2><Link href={`/studio/${photograph.id}`}>{photograph.title ?? "未命名照片"}</Link></h2><p>{photograph.location ?? "位置待补充"} · {formatDate(photograph.createdAt)}</p></div><div className="studio-row-actions"><button className="studio-secondary-button" disabled={workingId === photograph.id} onClick={() => void publish(photograph)} type="button">{photograph.status === "published" ? "撤回" : "发布"}</button><Link className="studio-row-edit" href={`/studio/${photograph.id}`}>编辑</Link><button className="studio-delete-button" disabled={workingId === photograph.id} onClick={() => void remove(photograph)} type="button">删除</button></div></article>)}
    </div>
    {message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}
  </section>;
}
