"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { saveStudioPost, uploadStudioPostCover } from "@/app/studio/writing/actions";
import { saveStudioProjectNotes, uploadStudioProjectImage } from "@/app/studio/projects/actions";
import { importStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import { ArticleDocumentHeader } from "@/components/article-document-header";
import { MarkdownPreview } from "@/components/studio/markdown-preview";
import { estimateReadingMinutes } from "@/lib/article";
import type { PostDocument, PostSummary, ProjectDocument, ProjectSummary } from "@/lib/content";
import { documentDate, documentIssues, documentMarkdown, insertMarkdown, type StudioDocumentFields } from "@/lib/studio-document";
import { firstProjectBodyImage, maxProjectImageBytes, projectImageAccept } from "@/lib/project-images";

type Props = { kind: "post" | "project"; document?: PostDocument | ProjectDocument | null; documents?: (PostSummary | ProjectSummary)[]; wikiLinks?: Record<string, string> };
type View = "write" | "split" | "preview";

function fieldsFrom(document: Props["document"], kind: Props["kind"]): StudioDocumentFields {
  const project = document?.kind === "project" ? document : undefined;
  return {
    title: document?.title ?? "", description: document?.description ?? "", slug: document?.slug ?? "",
    author: document?.author ?? "Whiskey", date: document?.date ?? documentDate(), tags: document?.tags.join(", ") ?? (kind === "post" ? "随笔" : "项目"),
    source: document?.source.trim() ?? "", coverImage: document?.coverImage ?? "", coverAlt: document?.coverAlt ?? "",
    role: project?.role ?? "Design / Development", featured: String(project?.featured ?? true), homeOrder: String(project?.homeOrder ?? 0),
    titleEn: project?.titleEn ?? "", descriptionEn: project?.descriptionEn ?? "", homeLabel: project?.homeLabel ?? "", coverFit: project?.coverFit ?? "cover", coverPosition: project?.coverPosition ?? "center",
  };
}

export function DocumentEditor({ kind, document = null, documents = [], wikiLinks = {} }: Props) {
  const router = useRouter();
  const isPost = kind === "post", noun = isPost ? "文章" : "项目", route = isPost ? "writing" : "projects";
  const [fields, setFields] = useState(() => fieldsFrom(document, kind));
  const [saved, setSaved] = useState(() => JSON.stringify(fieldsFrom(document, kind)));
  const [view, setView] = useState<View>("write");
  const [focused, setFocused] = useState(false);
  const [settings, setSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [backup, setBackup] = useState("");
  const [recovery, setRecovery] = useState<StudioDocumentFields | null>(null);
  const [beforeImport, setBeforeImport] = useState<StudioDocumentFields | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const sourceInput = useRef<HTMLTextAreaElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: document?.source.trim().length ?? 0, end: document?.source.trim().length ?? 0 });
  const slugEdited = useRef(false);
  const serial = JSON.stringify(fields), dirty = serial !== saved;
  const draftKey = `whiskey:studio:${kind}:${document?.slug ?? "new"}`;
  const deferred = useDeferredValue(fields);
  const bodyCover = !isPost && !deferred.coverImage ? firstProjectBodyImage(deferred.source) : undefined;
  const issues = documentIssues(fields);
  const busy = saving || importing;
  const set = (key: keyof StudioDocumentFields, value: string) => { if (key === "slug") slugEdited.current = true; setFields(current => ({ ...current, [key]: value })); };
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `${isPost ? "note" : "project"}-${Date.now().toString(36)}`;

  const saveBackup = useCallback(() => {
    try { localStorage.setItem(draftKey, serial); setBackup("本机草稿已备份"); }
    catch { setBackup("本机备份不可用，请导出 Markdown 保留内容"); }
  }, [draftKey, serial]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (!stored || stored === saved) return;
      const parsed = JSON.parse(stored) as StudioDocumentFields;
      if (Object.keys(fieldsFrom(document, kind)).every(key => typeof parsed[key as keyof StudioDocumentFields] === "string") && parsed.source.length <= 200_000) queueMicrotask(() => setRecovery(parsed));
    } catch { /* A blocked or stale local backup must not prevent writing. */ }
    // A document is remounted when its slug changes; do not re-read on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!dirty || recovery || saving) return;
    const timer = setTimeout(saveBackup, 800);
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { clearTimeout(timer); window.removeEventListener("beforeunload", warn); };
  }, [dirty, recovery, saveBackup, saving]);

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveBackup(); }
      if (event.key === "Escape") { setFocused(false); setSettings(false); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [saveBackup]);

  useEffect(() => {
    if (!dirty || recovery) return;
    const preserve = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) saveBackup();
    };
    window.document.addEventListener("click", preserve, true);
    window.document.addEventListener("submit", saveBackup, true);
    window.addEventListener("popstate", saveBackup);
    return () => { window.document.removeEventListener("click", preserve, true); window.document.removeEventListener("submit", saveBackup, true); window.removeEventListener("popstate", saveBackup); };
  }, [dirty, recovery, saveBackup]);

  function navigate(slug: string) {
    if (dirty) saveBackup();
    if (dirty && !window.confirm("当前内容尚未发布。确定切换吗？本页草稿会保留在此浏览器中。")) return;
    router.push(slug === "new" ? `/studio/${route}?mode=new` : `/studio/${route}?${isPost ? "post" : "project"}=${encodeURIComponent(slug)}`);
  }

  function format(before: string, after = "", placeholder = "文字") {
    const input = sourceInput.current;
    const result = insertMarkdown(fields.source, input?.selectionStart ?? fields.source.length, input?.selectionEnd ?? fields.source.length, before, after, placeholder);
    set("source", result.source);
    requestAnimationFrame(() => { sourceInput.current?.focus(); sourceInput.current?.setSelectionRange(result.start, result.end); });
  }

  function sourceKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey || event.metaKey) {
      const keys: Record<string, () => void> = { b: () => format("**", "**"), i: () => format("*", "*"), k: () => format("[", "](https://)", "链接文字") };
      if (keys[event.key.toLowerCase()]) { event.preventDefault(); keys[event.key.toLowerCase()](); }
    }
  }

  async function importFile(file?: File) {
    if (!file) return;
    setImporting(true); setMessage("");
    try {
      const form = new FormData(); form.set("document", file);
      const result = await importStudioMarkdown(form);
      const metadata = Object.fromEntries(Object.entries(result.metadata).filter(([key]) => key in fields)) as Partial<StudioDocumentFields>;
      if (metadata.slug) slugEdited.current = true;
      setBeforeImport(fields);
      setFields(current => ({ ...current, ...metadata, slug: document?.slug ?? metadata.slug ?? (current.slug || generateSlug(metadata.title ?? file.name)), source: result.source }));
      setMessage(`已导入「${file.name}」，可继续编辑；尚未发布。文中的本地附件需另行上传。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败，原内容未改变。"); }
    finally { setImporting(false); }
  }

  async function upload(file: File | undefined, target: "cover" | "body") {
    if (!file) return;
    if (!file.size || file.size > maxProjectImageBytes) { setMessage("请选择 3.75MB 以内的 JPG、PNG、WebP 或 GIF 图片。"); return; }
    const anchor = { ...selection.current }, previousSource = fields.source;
    setUploading(true); setMessage("");
    try {
      const form = new FormData(); form.set(isPost ? "cover" : "image", file);
      const result = await (isPost ? uploadStudioPostCover(form) : uploadStudioProjectImage(form));
      if (!result.ok || !result.path) throw new Error(result.message || "上传失败，请重试。");
      const path = result.path;
      if (target === "cover") set("coverImage", path);
      else setFields(current => {
        const start = current.source === previousSource ? anchor.start : current.source.length;
        const end = current.source === previousSource ? anchor.end : start;
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[\[\]\\\r\n]/g, " ");
        return { ...current, source: `${current.source.slice(0, start)}\n\n![${alt}](${path})\n\n${current.source.slice(end)}` };
      });
      setMessage(target === "cover" ? "封面已上传，发布后显示在文章与目录中。" : "图片已插入正文，请补充图片说明后发布。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "上传请求未完成，请重试。"); }
    finally { setUploading(false); }
  }

  function exportFile() {
    const url = URL.createObjectURL(new Blob([documentMarkdown(fields, kind)], { type: "text/markdown;charset=utf-8" }));
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `${fields.slug || "untitled"}.md`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Markdown 已导出，包含文章信息与正文。");
  }

  async function publish() {
    setShowIssues(true);
    if (issues.length) { setMessage("发布前还有信息需要补充。"); if (!fields.title.trim() || !fields.source.trim() || !fields.description.trim()) { setView("write"); requestAnimationFrame(() => titleInput.current?.focus()); } return; }
    setSaving(true); setMessage("");
    const snapshot = JSON.stringify(fields);
    const form = new FormData(); Object.entries(fields).forEach(([key, value]) => form.set(key, key === "tags" ? value.replaceAll("，", ",") : value));
    form.set("originalSlug", document?.slug ?? "");
    try {
      const result = await (isPost ? saveStudioPost(form) : saveStudioProjectNotes(form));
      if (!result.ok) throw new Error(result.message);
      setSaved(snapshot); setMessage(`${noun}已${document ? "更新" : "发布"}，公开页面已同步。`); setBackup(""); setBeforeImport(null);
      try { localStorage.removeItem(draftKey); } catch { /* Publishing must not depend on local storage. */ }
      if (!document) router.replace(`/studio/${route}?${isPost ? "post" : "project"}=${encodeURIComponent(fields.slug)}`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "发布失败，内容仍保留，请重试。"); }
    finally { setSaving(false); }
  }

  const input = (key: keyof StudioDocumentFields, label: string, options: { type?: string; hint?: string } = {}) => <label>{label}<input aria-label={label} type={options.type ?? "text"} value={fields[key]} onChange={event => set(key, event.target.value)} disabled={busy} readOnly={key === "slug" && Boolean(document)} />{options.hint && <small>{options.hint}</small>}</label>;

  return <section className="journal-editor" data-view={view} data-focus={focused} data-settings={settings} aria-label={isPost ? "Notes 编辑器" : "项目编辑器"}>
    <header className="journal-editor-heading"><div><p className="studio-kicker">THE WRITING ROOM / {isPost ? "NOTES" : "PROJECTS"}</p><h1>{document ? "继续，把它写好。" : "为新的想法，留一页。"}</h1></div><label className="journal-document-picker"><span>切换{noun}</span><select aria-label={isPost ? "选择 Notes" : "选择项目"} value={document?.slug ?? "new"} disabled={busy} onChange={event => navigate(event.target.value)}><option value="new">＋ 新建{noun}</option>{documents.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label></header>
    <div className="journal-editor-toolbar">
      <div className="journal-view-switch" aria-label="编辑视图">{(["write", "split", "preview"] as const).map((mode, index) => <button type="button" key={mode} aria-pressed={view === mode} onClick={() => setView(mode)}>{["写作", "对照", "预览"][index]}</button>)}</div>
      <div className="journal-file-actions"><button type="button" disabled={busy} onClick={() => importInput.current?.click()}>{importing ? "导入中…" : "导入 .md"}</button><button type="button" onClick={exportFile}>导出</button><button type="button" aria-pressed={focused} onClick={() => setFocused(!focused)}>{focused ? "退出专注" : "专注"}</button></div>
      <button type="button" className="studio-button" aria-expanded={settings} aria-controls="document-publish-settings" onClick={() => setSettings(!settings)}>发布设置 <span aria-hidden="true">↗</span></button>
    </div>
    <input ref={importInput} className="journal-file-input" type="file" accept=".md,.markdown,.mdx,text/markdown" aria-label="导入 Markdown 文件" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void importFile(file); }} />
    <input ref={imageInput} className="journal-file-input" type="file" accept={projectImageAccept} aria-label="上传正文图片" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "body"); }} />
    {recovery && <div className="journal-recovery" role="status"><span>找到了本页尚未发布的草稿。</span><button onClick={() => { setFields(recovery); setRecovery(null); setMessage("本页草稿已恢复，尚未发布。"); }}>恢复草稿</button><button onClick={() => { try { localStorage.removeItem(draftKey); } catch { /* Local storage is optional. */ } setRecovery(null); }}>使用当前版本</button></div>}
    <div className="journal-editor-body">
      <div className="journal-canvas">
        {view !== "preview" && <section className="journal-source" aria-label="写作区">
          <div className="journal-page-label"><span>MANUSCRIPT / {noun}</span><span>{dirty ? "编辑中" : document ? "已发布" : "新稿"}</span></div>
          <label className="journal-title"><span className="sr-only">{isPost ? "标题" : "项目名称"}</span><textarea aria-label={isPost ? "标题" : "项目名称"} ref={titleInput} rows={1} value={fields.title} placeholder={isPost ? "写下标题" : "项目名称"} disabled={busy} onChange={event => setFields(current => ({ ...current, title: event.target.value, slug: !document && !slugEdited.current ? (/[a-z0-9]/i.test(event.target.value) ? generateSlug(event.target.value) : current.slug || generateSlug(event.target.value)) : current.slug }))} /></label>
          <label className="journal-deck"><span className="sr-only">{isPost ? "摘要" : "项目简介"}</span><textarea aria-label={isPost ? "摘要" : "项目简介"} value={fields.description} placeholder="用一两句话，介绍这一页。" rows={2} disabled={busy} onChange={event => set("description", event.target.value)} /></label>
          <div className="journal-formatbar" aria-label="Markdown 工具"><button type="button" disabled={busy} onClick={() => format("## ", "", "小标题")}>H₂</button><button type="button" disabled={busy} aria-label="加粗" onClick={() => format("**", "**")}><b>B</b></button><button type="button" disabled={busy} aria-label="斜体" onClick={() => format("*", "*")}><i>I</i></button><button type="button" disabled={busy} onClick={() => format("[", "](https://)", "链接文字")}>链接</button><button type="button" disabled={busy} onClick={() => format("\n> ", "", "引用")}>引用</button><button type="button" disabled={busy} onClick={() => format("\n- ", "", "列表项")}>列表</button><button type="button" disabled={busy} onClick={() => format("\n```text\n", "\n```\n", "代码")}>代码</button><button type="button" disabled={busy || uploading} onClick={() => imageInput.current?.click()}>{uploading ? "上传中…" : "插入图片"}</button></div>
          <textarea ref={sourceInput} className="journal-source-input" aria-label={isPost ? "Markdown" : "项目笔记（Markdown）"} value={fields.source} placeholder={"从第一句话开始。\n\n支持 Markdown，也可以直接导入已有的 .md 文件。"} spellCheck={false} disabled={busy} onChange={event => set("source", event.target.value)} onKeyDown={sourceKey} onSelect={event => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }} onPaste={event => { const file = Array.from(event.clipboardData.files).find(file => file.type.startsWith("image/")); if (file && !uploading && !busy) { event.preventDefault(); void upload(file, "body"); } }} onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }} onDrop={event => { const file = event.dataTransfer.files[0]; if (!file) return; event.preventDefault(); if (busy || uploading) return; if (/\.(md|markdown|mdx)$/i.test(file.name)) void importFile(file); else void upload(file, "body"); }} />
          <p className="journal-source-tip">Markdown · Ctrl / ⌘ B 加粗 · Ctrl / ⌘ S 备份草稿 · 图片可粘贴或拖入</p>
        </section>}
        {view !== "write" && <section className="journal-preview" aria-label={isPost ? "Markdown 实时预览" : "项目预览"} aria-busy={deferred !== fields} lang="zh-CN"><div className="journal-page-label"><span>READING PROOF</span><span>与博客同版式</span></div><article className="blog-article"><ArticleDocumentHeader kind={kind} preview document={{ ...deferred, coverImage: deferred.coverImage || bodyCover?.src, coverAlt: deferred.coverAlt || bodyCover?.alt, title: deferred.title || `未命名${noun}`, tags: deferred.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean), author: isPost ? deferred.author : deferred.role, readingMinutes: estimateReadingMinutes(deferred.source) }} /><MarkdownPreview source={deferred.source} wikiLinks={wikiLinks} /></article></section>}
      </div>
      {settings && <aside className="journal-publish" id="document-publish-settings" aria-label="发布设置"><div className="journal-publish-heading"><div><p className="studio-kicker">READY FOR THE JOURNAL</p><h2>准备发布</h2></div><button type="button" aria-label="收起发布设置" onClick={() => setSettings(false)}>×</button></div><p className="journal-publish-intro">检查这一页的展示信息，再把它放进你的个人杂志。</p>
        <fieldset disabled={busy}><legend className="sr-only">发布信息</legend>{input("slug", "公开地址", { hint: document ? "已发布内容的地址保持不变。" : "可修改；使用小写英文、数字和连字符。" })}{input("date", "日期", { type: "date" })}{input("tags", "标签", { hint: "多个标签用逗号分隔。" })}{isPost ? input("author", "作者") : input("role", "项目角色")}
          <details className="journal-cover-settings" open={Boolean(fields.coverImage)}><summary>封面与图片说明</summary><label>上传封面<input aria-label="上传封面" type="file" accept={projectImageAccept} disabled={uploading} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "cover"); }} /><small>公开配图，JPG / PNG / WebP / GIF，最大 3.75MB。</small></label>{input("coverImage", "封面地址")}{input("coverAlt", "封面替代文本")}{fields.coverImage && <button type="button" className="journal-text-button" onClick={() => set("coverImage", "")}>移除这页的封面</button>}</details>
          {!isPost && <details><summary>首页展示与英文信息</summary><label className="journal-check"><input type="checkbox" checked={fields.featured === "true"} onChange={event => set("featured", String(event.target.checked))} />在首页展示</label>{input("homeOrder", "首页排序", { type: "number" })}{input("titleEn", "英文项目名")}{input("descriptionEn", "英文简介")}{input("homeLabel", "首页小标签")}<label>封面排布<select value={fields.coverFit} onChange={event => set("coverFit", event.target.value)}><option value="cover">铺满图框</option><option value="contain">完整显示</option></select></label>{input("coverPosition", "封面焦点", { hint: "center 或 50% 50%" })}</details>}
        </fieldset>
        {showIssues && issues.length > 0 && <div className="journal-publish-issues" role="alert"><p>还差这几项：</p><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
        <button className="studio-button journal-publish-button" type="button" disabled={busy || uploading} onClick={() => void publish()}>{saving ? "正在发布…" : `${document ? "更新" : "发布"}${noun}`}</button><p className="journal-publish-note">点击后公开展示。草稿备份只保存在此浏览器中，不会自动发布。</p>{document && <Link className="journal-public-link" href={document.href} target="_blank" rel="noreferrer">查看公开页面 ↗</Link>}
      </aside>}
    </div>
    <footer className="journal-editor-status"><span><span className={`journal-state-dot${dirty ? " is-dirty" : ""}`} />{dirty ? backup || "有未发布的修改" : document ? "与已发布版本一致" : "尚未发布"}</span><span>{fields.source.length.toLocaleString("zh-CN")} 字符 · 约 {estimateReadingMinutes(fields.source)} 分钟阅读</span><button type="button" onClick={saveBackup}>备份草稿</button></footer>
    {message && <div className="journal-editor-message" role="status"><p>{message}</p>{beforeImport && <button type="button" onClick={() => { setFields(beforeImport); setBeforeImport(null); setMessage("已撤销导入。"); }}>撤销导入</button>}</div>}
  </section>;
}
