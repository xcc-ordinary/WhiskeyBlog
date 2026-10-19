"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";

import { saveStudioProjectNotes, uploadStudioProjectImage } from "@/app/studio/projects/actions";
import { MarkdownPreview } from "@/components/studio/markdown-preview";
import type { ProjectDocument, ProjectSummary } from "@/lib/content";
import { maxProjectImageBytes, projectImageAccept } from "@/lib/project-images";
import "./project-editor.css";

type Fields = { title: string; description: string; slug: string; date: string; tags: string; role: string; coverImage: string; coverAlt: string; source: string; featured: string; homeOrder: string; titleEn: string; descriptionEn: string; homeLabel: string; coverFit: string; coverPosition: string };

const emptyProject: Fields = {
  title: "", description: "", slug: "", date: new Date().toISOString().slice(0, 10), tags: "Next.js",
  role: "Design / Development", coverImage: "", coverAlt: "", source: "## 项目背景\n\n从这里记录项目过程。",
  featured: "true", homeOrder: "0", titleEn: "", descriptionEn: "", homeLabel: "", coverFit: "cover", coverPosition: "center",
};

function fieldsFrom(project?: ProjectDocument | null): Fields {
  return project ? { title: project.title, description: project.description, slug: project.slug, date: project.date, tags: project.tags.join(", "), role: project.role ?? "", coverImage: project.coverImage ?? "", coverAlt: project.coverAlt ?? "", source: project.source.trim(), featured: String(project.featured ?? true), homeOrder: String(project.homeOrder ?? 0), titleEn: project.titleEn ?? "", descriptionEn: project.descriptionEn ?? "", homeLabel: project.homeLabel ?? "", coverFit: project.coverFit ?? "cover", coverPosition: project.coverPosition ?? "center" } : emptyProject;
}

export function ProjectNotesEditor({ project = null, projects = [] }: { project?: ProjectDocument | null; projects?: ProjectSummary[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(project));
  const [message, setMessage] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(fieldsFrom(project)));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<"split" | "write" | "preview">("split");
  const dirty = JSON.stringify(fields) !== savedSnapshot;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sourceInput = useRef<HTMLTextAreaElement>(null);
  const sourceSelection = useRef<{ start: number; end: number } | null>(null);
  const deferredSource = useDeferredValue(fields.source);
  const set = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true); setMessage("");
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    data.set("originalSlug", project?.slug ?? "");
    try {
      const result = await saveStudioProjectNotes(data);
      setMessage(result.message);
      if (result.ok) {
        setSavedSnapshot(JSON.stringify(fields));
        if (!project) router.replace(`/studio/projects?project=${encodeURIComponent(fields.slug)}`);
        router.refresh();
      }
    } catch { setMessage("保存请求未完成，内容仍保留在编辑器中，请重试。"); }
    finally { setSaving(false); }
  }

  async function upload(file: File | undefined, target: "cover" | "body") {
    if (!file) return;
    if (!file.size || file.size > maxProjectImageBytes) { setMessage("请选择 3.75MB 以内的图片。"); return; }
    const selection = sourceSelection.current;
    setUploading(true); setMessage("");
    try {
      const data = new FormData(); data.set("image", file);
      const result = await uploadStudioProjectImage(data);
      if (!result.ok || !result.path) { setMessage(result.message ?? "图片上传失败。"); return; }
      const imagePath = result.path;
      if (target === "cover") set("coverImage", imagePath);
      else {
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[\[\]\\\r\n]/g, " ");
        setFields(current => {
          const start = selection?.start ?? current.source.length, end = selection?.end ?? start;
          return { ...current, source: `${current.source.slice(0, start)}\n\n![${alt}](${imagePath})\n\n${current.source.slice(end)}` };
        });
      }
      setMessage(target === "cover" ? "封面已上传，点击「保存项目」后同步到首页与项目页面。" : "图片已插入正文，点击「保存项目」后发布。可在 Markdown 中修改图片说明。");
    } catch { setMessage("上传请求未完成，请稍后重试。"); }
    finally { setUploading(false); }
  }

  return <section className={`post-editor notes-editor notes-editor-view-${view}`} aria-label="项目编辑器">
    <header className="notes-editor-toolbar">
      <label className="notes-editor-picker"><span>当前项目</span><select aria-label="选择项目" value={project?.slug ?? "new"} onChange={event => { if (dirty && !window.confirm("有未保存的修改，确定切换项目吗？")) return; router.push(event.target.value === "new" ? "/studio/projects?mode=new" : `/studio/projects?project=${encodeURIComponent(event.target.value)}`); }}><option value="new">＋ 新建项目</option>{projects.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      <div className="notes-editor-view-switch" aria-label="项目编辑视图">{(["split", "write", "preview"] as const).map((mode, index) => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{["双栏", "仅写作", "仅预览"][index]}</button>)}</div>
      <div className="notes-editor-toolbar-actions"><Link className="notes-editor-text-action" href="/studio/projects?mode=new">新建项目</Link>{project ? <Link className="notes-editor-text-action" href={project.href}>公开页面 ↗</Link> : null}<button className="studio-button" disabled={saving || uploading} onClick={() => startTransition(async () => { await save(); })} type="button">{saving ? "正在保存…" : "保存项目"}</button></div>
    </header>
    <div className="notes-editor-layout">
      <button className="studio-settings-toggle" type="button" aria-expanded={settingsOpen} aria-controls="project-editor-settings" onClick={() => setSettingsOpen(!settingsOpen)}>项目设置：封面、简介与首页展示 {settingsOpen ? "−" : "+"}</button>
      <aside id="project-editor-settings" data-open={settingsOpen} className="notes-editor-settings" aria-label="项目设置">
        <div className="notes-editor-section-heading"><p className="studio-kicker">DOCUMENT</p><h2>项目设置</h2></div>
    <div className="notes-editor-meta">
      <label>项目名称<input value={fields.title} onChange={(event) => set("title", event.target.value)} /></label>
      <label>项目日期<input type="date" value={fields.date} onChange={(event) => set("date", event.target.value)} /></label>
      <label>Slug<input readOnly={Boolean(project)} value={fields.slug} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="my-project" /><small>{project ? "已有项目的公开地址保持不变" : "使用小写英文与连字符"}</small></label>
      <label>角色<input value={fields.role} onChange={(event) => set("role", event.target.value)} /></label>
      <label className="post-editor-wide">项目简介<textarea rows={2} value={fields.description} onChange={(event) => set("description", event.target.value)} /></label>
      <label>标签（逗号分隔）<input value={fields.tags} onChange={(event) => set("tags", event.target.value)} /></label>
      <label>封面地址<input value={fields.coverImage} onChange={(event) => set("coverImage", event.target.value)} /></label>
      <label>卡片封面排布<select value={fields.coverFit} onChange={event => set("coverFit", event.target.value)}><option value="cover">铺满画框</option><option value="contain">完整显示</option></select></label>
      <label>卡片封面焦点<input value={fields.coverPosition} onChange={event => set("coverPosition", event.target.value)} placeholder="center 或 50% 50%" /><small>项目正文封面始终按原始比例完整显示。</small></label>
      <label>上传项目封面<input type="file" accept={projectImageAccept} disabled={uploading || saving} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; startTransition(async () => { await upload(file, "cover"); }); }} /><small>JPG、PNG、WebP 或 GIF，最大 3.75MB；上传后需保存项目。</small></label>
      <label className="post-editor-wide">封面替代文本<input value={fields.coverAlt} onChange={(event) => set("coverAlt", event.target.value)} /></label>
    </div>
    <details className="project-extra-settings"><summary>首页展示与英文设置</summary><fieldset className="project-home-settings"><legend>首页精选作品</legend><p>首页横向作品目录、项目列表与详情使用同一份标题、简介和封面。藏梦书境的大图与介绍也同步更新，原有交互预览保持不变。</p><div className="notes-editor-meta"><label className="project-featured-toggle"><input type="checkbox" checked={fields.featured === "true"} onChange={event => set("featured", String(event.target.checked))} />在首页展示此项目</label><label>首页排序<input type="number" min="0" step="1" value={fields.homeOrder} onChange={event => set("homeOrder", event.target.value)} /><small>数字越小越靠前；未勾选时仍会出现在项目列表。</small></label><label>英文项目名称（可选）<input value={fields.titleEn} onChange={event => set("titleEn", event.target.value)} /></label><label>首页小标签（可选）<input value={fields.homeLabel} onChange={event => set("homeLabel", event.target.value)} placeholder="PRODUCT" /></label><label className="post-editor-wide">英文项目简介（可选）<textarea rows={2} value={fields.descriptionEn} onChange={event => set("descriptionEn", event.target.value)} /><small>英文模式使用；留空时显示原项目文案。</small></label></div></fieldset></details>

      </aside>
      <div className="notes-editor-canvas">
        {view !== "preview" ? <label className="notes-editor-source-pane"><span className="notes-editor-pane-label"><b>Markdown</b><small>{fields.source.length.toLocaleString("zh-CN")} 字符</small></span><textarea aria-label="项目笔记（Markdown）" ref={sourceInput} onSelect={event => { sourceSelection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }} className="post-editor-source" value={fields.source} onChange={event => set("source", event.target.value)} spellCheck="false" /></label> : null}
        {view !== "write" ? <section className="post-editor-preview" aria-label="项目预览"><div className="notes-editor-pane-label"><b>实时预览</b><small>与公开文章使用同一渲染器</small></div><article className="notes-preview-document"><p className="studio-kicker">PROJECT / PREVIEW</p><h2>{fields.title || "未命名项目"}</h2><p className="post-preview-description">{fields.description || "项目简介会显示在这里。"}</p>{fields.coverImage ? <Image src={fields.coverImage} alt={fields.coverAlt || "项目封面预览"} width={1200} height={800} unoptimized style={{ height: "auto" }} /> : null}<MarkdownPreview source={deferredSource} /></article></section> : null}
      </div>
    </div>
    <footer className="notes-editor-status"><span>{dirty ? "有未保存的修改" : project ? "内容已保存" : "尚未保存"}</span><p aria-live="polite">{message || "保存项目后，封面、简介与正文同步到公开页面。"}</p><label className="project-body-upload">插入正文图片<input type="file" accept={projectImageAccept} disabled={uploading || saving} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; startTransition(async () => { await upload(file, "body"); }); }} /><small>图片插入光标位置。{uploading ? "正在上传…" : ""}</small></label></footer>
  </section>;
}
