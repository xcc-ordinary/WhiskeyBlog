"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Photograph, PhotographStatus } from "@/lib/supabase/types";
import { UploadDrawer } from "@/components/studio/upload-drawer";

const labels: Record<PhotographStatus, string> = { draft: "草稿", published: "已发布" };
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value)); }
export function PhotographLibrary({ photographs }: { photographs: Photograph[] }) {
  const [activeTab, setActiveTab] = useState<PhotographStatus>("draft");
  const visiblePhotographs = useMemo(() => photographs.filter((photograph) => photograph.status === activeTab), [activeTab, photographs]);
  return <section aria-label="照片资料库" className="studio-library">
    <div className="studio-library-toolbar"><p>每张照片先进入私密草稿，完成资料与衍生图后再公开。</p><UploadDrawer /></div>
    <div aria-label="照片状态" className="studio-library-tabs" role="tablist">
      {(["draft", "published"] as const).map((status) => { const count = photographs.filter((photograph) => photograph.status === status).length; return <button aria-selected={activeTab === status} className="studio-tab" key={status} onClick={() => setActiveTab(status)} role="tab" type="button">{labels[status]} <span>{count}</span></button>; })}
    </div>
    <div className="studio-library-list" role="tabpanel">
      {visiblePhotographs.length === 0 ? <div className="studio-empty-state"><p className="studio-kicker">{activeTab === "draft" ? "01 / DRAFTS" : "02 / PUBLISHED"}</p><h2>{activeTab === "draft" ? "还没有待整理的照片。" : "还没有公开的摄影作品。"}</h2><p>上传一张照片，它会先作为私密草稿进入你的档案。</p></div> : visiblePhotographs.map((photograph, index) => <article className="studio-photograph-row" key={photograph.id}><span aria-hidden="true" className="studio-row-number">{String(index + 1).padStart(2, "0")}</span><div><h2><Link href={`/studio/${photograph.id}`}>{photograph.title ?? "未命名照片"}</Link></h2><p>{photograph.location ?? "位置待补充"} · {formatDate(photograph.createdAt)}</p></div><span className={`studio-status studio-status-${photograph.status}`}>{labels[photograph.status]}</span></article>)}
    </div>
  </section>;
}
