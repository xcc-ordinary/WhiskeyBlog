"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { saveStudioProjectNotes } from "@/app/studio/projects/actions";
import type { ProjectDocument, ProjectSummary } from "@/lib/content";

type Fields = { title: string; description: string; slug: string; date: string; tags: string; role: string; coverImage: string; coverAlt: string; source: string };

const emptyProject: Fields = {
  title: "", description: "", slug: "", date: new Date().toISOString().slice(0, 10), tags: "Next.js",
  role: "Design / Development", coverImage: "", coverAlt: "", source: "## 项目背景\n\n从这里记录项目过程。",
};

function fieldsFrom(project?: ProjectDocument | null): Fields {
  return project ? { title: project.title, description: project.description, slug: project.slug, date: project.date, tags: project.tags.join(", "), role: project.role ?? "", coverImage: project.coverImage ?? "", coverAlt: project.coverAlt ?? "", source: project.source.trim() } : emptyProject;
}

function markdownPreview(source: string) {
  return source.split("\n").filter(Boolean).map((line, index) => {
    if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={index}>{line.slice(2)}</h1>;
    return <p key={index}>{line}</p>;
  });
}

export function ProjectNotesEditor({ project = null, projects = [] }: { project?: ProjectDocument | null; projects?: ProjectSummary[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(project));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const preview = useMemo(() => markdownPreview(fields.source), [fields.source]);
  const set = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true); setMessage("");
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    data.set("originalSlug", project?.slug ?? "");
    const result = await saveStudioProjectNotes(data);
    setMessage(result.message); setSaving(false);
    if (result.ok) {
      if (!project) router.replace(`/studio/projects?project=${encodeURIComponent(fields.slug)}`);
      router.refresh();
    }
  }

  return <section className="post-editor" aria-label="项目编辑器">
    <div className="studio-content-picker">
      <label>选择项目<select aria-label="选择项目" value={project?.slug ?? "new"} onChange={(event) => { window.location.href = event.target.value === "new" ? "/studio/projects?mode=new" : `/studio/projects?project=${encodeURIComponent(event.target.value)}`; }}><option value="new">＋ 新建项目</option>{projects.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      <Link className="studio-secondary-button" href="/studio/projects?mode=new">新建项目</Link>
    </div>
    <div className="post-editor-meta">
      <label>项目名称<input value={fields.title} onChange={(event) => set("title", event.target.value)} /></label>
      <label>项目日期<input type="date" value={fields.date} onChange={(event) => set("date", event.target.value)} /></label>
      <label>Slug<input readOnly={Boolean(project)} value={fields.slug} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="my-project" /><small>{project ? "已有项目的公开地址保持不变" : "使用小写英文与连字符"}</small></label>
      <label>角色<input value={fields.role} onChange={(event) => set("role", event.target.value)} /></label>
      <label className="post-editor-wide">项目简介<textarea rows={2} value={fields.description} onChange={(event) => set("description", event.target.value)} /></label>
      <label>标签（逗号分隔）<input value={fields.tags} onChange={(event) => set("tags", event.target.value)} /></label>
      <label>封面地址<input value={fields.coverImage} onChange={(event) => set("coverImage", event.target.value)} /></label>
      <label className="post-editor-wide">封面替代文本<input value={fields.coverAlt} onChange={(event) => set("coverAlt", event.target.value)} /></label>
    </div>
    <div className="post-editor-workspace"><label>项目笔记（Markdown）<textarea className="post-editor-source" value={fields.source} onChange={(event) => set("source", event.target.value)} spellCheck="false" /></label><section className="post-editor-preview" aria-label="项目预览"><p className="studio-kicker">PROJECT PREVIEW</p><h2>{fields.title || "未命名项目"}</h2><p className="post-preview-description">{fields.description || "项目简介会显示在这里。"}</p><div className="prose">{preview}</div></section></div>
    <div className="post-editor-actions"><button className="studio-button" disabled={saving} onClick={() => void save()} type="button">{saving ? "正在保存…" : "保存项目"}</button>{project ? <Link className="studio-row-edit" href={project.href}>查看公开项目 ↗</Link> : null}{message ? <p aria-live="polite">{message}</p> : null}</div>
  </section>;
}
