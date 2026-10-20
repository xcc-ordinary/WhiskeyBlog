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
import { documentHeaderCover, maxProjectImageBytes, projectImageAccept } from "@/lib/project-images";

type Props = { kind: "post" | "project"; document?: PostDocument | ProjectDocument | null; documents?: (PostSummary | ProjectSummary)[]; wikiLinks?: Record<string, string> };
import { documentTags, footerTags } from "@/lib/content-tags";
import { TagField } from "./tag-field";
import { AutoTextarea } from "./auto-textarea";
import { StudioDialog } from "./studio-dialog";
import { LiveManuscript, type LiveManuscriptHandle } from "./live-manuscript";

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
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceMode, setSourceMode] = useState(false);
  const live = useRef<LiveManuscriptHandle>(null);
  const coverInput = useRef<HTMLInputElement>(null);
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
  const headerCover = documentHeaderCover(deferred.coverImage, deferred.source);
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
      if (event.key === "Escape") { if (settings || picker) { setSettings(false); setPicker(false); } else setFocused(false); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [saveBackup, settings, picker]);

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
    if (view === "write" && !sourceMode) { live.current?.format(before, after, placeholder); return; }
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
      setBeforeImport(fields); setSourceMode(true);
      setFields(current => ({ ...current, ...metadata, slug: document?.slug ?? metadata.slug ?? (current.slug || generateSlug(metadata.title ?? file.name)), source: result.source }));
      setMessage(`已导入「${file.name}」，可继续编辑；尚未发布。文中的本地附件需另行上传。`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败，原内容未改变。"); }
    finally { setImporting(false); }
  }

  async function upload(file: File | undefined, target: "cover" | "body") {
    if (!file) return;
    if (!file.size || file.size > maxProjectImageBytes) { setMessage("请选择 3.75MB 以内的 JPG、PNG、WebP 或 GIF 图片。"); return; }
    const anchor = { ...selection.current }, previousSource = fields.source;
    if (target === "body") setSourceMode(true);
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
    if (issues.length) { setMessage("发布前还有信息需要补充。"); if (!fields.title.trim() || !fields.source.trim() || !fields.description.trim()) { setSettings(false); setView("write"); requestAnimationFrame(() => titleInput.current?.focus()); } return; }
    setSaving(true); setMessage("");
    const snapshot = JSON.stringify(fields);
    const form = new FormData(); Object.entries(fields).forEach(([key, value]) => form.set(key, key === "tags" ? documentTags(value, fields.source).join(", ") : value));
    form.set("originalSlug", document?.slug ?? "");
    try {
      const result = await (isPost ? saveStudioPost(form) : saveStudioProjectNotes(form));
      if (!result.ok) throw new Error(result.message);
      setSaved(snapshot); setSettings(false); setMessage(`${noun}已${document ? "更新" : "发布"}，公开页面已同步。`); setBackup(""); setBeforeImport(null);
      try { localStorage.removeItem(draftKey); } catch { /* Publishing must not depend on local storage. */ }
      if (!document) router.replace(`/studio/${route}?${isPost ? "post" : "project"}=${encodeURIComponent(fields.slug)}`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "发布失败，内容仍保留，请重试。"); }
    finally { setSaving(false); }
  }

  const input = (key: keyof StudioDocumentFields, label: string, options: { type?: string; hint?: string } = {}) => <label className="studio-field"><span>{label}</span><input aria-label={label} type={options.type ?? "text"} value={fields[key]} onChange={event => set(key, event.target.value)} disabled={busy} readOnly={key === "slug" && Boolean(document)} /><small>{options.hint || "\u00a0"}</small></label>;

  return <section className="journal-editor" data-view={view} data-focus={focused} data-settings={settings} aria-label={isPost ? "Notes 编辑器" : "项目编辑器"}>
    <header className="journal-editor-heading"><div><p className="studio-kicker">THE WRITING ROOM / {isPost ? "NOTES" : "PROJECTS"}</p><h1>{document ? "继续，把它写好。" : "为新的想法，留一页。"}</h1></div><button type="button" className="journal-document-trigger" aria-label={isPost ? "选择 Notes" : "选择项目"} aria-haspopup="dialog" disabled={busy} onClick={() => { setQuery(""); setPicker(true); }}><span>{document ? document.title : `新建${noun}`}</span><span aria-hidden="true">⌄</span></button></header>
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
          <label className="journal-title"><span className="sr-only">{isPost ? "标题" : "项目名称"}</span><AutoTextarea aria-label={isPost ? "标题" : "项目名称"} inputRef={titleInput} rows={1} value={fields.title} placeholder={isPost ? "写下标题" : "项目名称"} disabled={busy} onChange={event => setFields(current => ({ ...current, title: event.target.value, slug: !document && !slugEdited.current ? (/[a-z0-9]/i.test(event.target.value) ? generateSlug(event.target.value) : current.slug || generateSlug(event.target.value)) : current.slug }))} /></label>
          <label className="journal-deck"><span className="sr-only">{isPost ? "摘要" : "项目简介"}</span><AutoTextarea aria-label={isPost ? "摘要" : "项目简介"} value={fields.description} placeholder="用一两句话，介绍这一页。" rows={2} disabled={busy} onChange={event => set("description", event.target.value)} /></label>
          <div className="journal-formatbar" aria-label="Markdown 工具" onMouseDown={event => { if (event.target instanceof Element && event.target.closest("button")) event.preventDefault(); }}><button type="button" className="journal-edit-mode" aria-pressed={sourceMode} onClick={() => setSourceMode(!sourceMode)}>{sourceMode || view === "split" ? "Markdown 源码" : "即时排版"}</button><button type="button" disabled={busy} onClick={() => format("## ", "", "小标题")}>H₂</button><button type="button" disabled={busy} aria-label="加粗" onClick={() => format("**", "**")}><b>B</b></button><button type="button" disabled={busy} aria-label="斜体" onClick={() => format("*", "*")}><i>I</i></button><button type="button" disabled={busy} onClick={() => format("[", "](https://)", "链接文字")}>链接</button><button type="button" disabled={busy} onClick={() => format("\n> ", "", "引用")}>引用</button><button type="button" disabled={busy} onClick={() => format("\n- ", "", "列表项")}>列表</button><button type="button" disabled={busy} onClick={() => format("\n```text\n", "\n```\n", "代码")}>代码</button><button type="button" disabled={busy || uploading} onClick={() => imageInput.current?.click()}>{uploading ? "上传中…" : "插入图片"}</button></div>
          {view === "write" && !sourceMode ? <div onPaste={event => { const file = Array.from(event.clipboardData.files).find(file => file.type.startsWith("image/")); if (file && !uploading && !busy) { event.preventDefault(); void upload(file, "body"); } }} onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }} onDrop={event => { const file = event.dataTransfer.files[0]; if (!file || busy || uploading) return; event.preventDefault(); if (/\.(md|markdown|mdx)$/i.test(file.name)) void importFile(file); else void upload(file, "body"); }}><LiveManuscript source={fields.source} onChange={value => set("source", value)} onSelection={(start, end) => { selection.current = { start, end }; }} wikiLinks={wikiLinks} disabled={busy} handleRef={live} /></div> : <AutoTextarea inputRef={sourceInput} className="journal-source-input" aria-label={isPost ? "Markdown" : "项目笔记（Markdown）"} value={fields.source} placeholder={"从第一句话开始。\n\n支持 Markdown，也可以直接导入已有的 .md 文件。"} spellCheck={false} disabled={busy} onChange={event => set("source", event.target.value)} onKeyDown={sourceKey} onSelect={event => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }} onPaste={event => { const file = Array.from(event.clipboardData.files).find(file => file.type.startsWith("image/")); if (file && !uploading && !busy) { event.preventDefault(); void upload(file, "body"); } }} onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }} onDrop={event => { const file = event.dataTransfer.files[0]; if (!file) return; event.preventDefault(); if (busy || uploading) return; if (/\.(md|markdown|mdx)$/i.test(file.name)) void importFile(file); else void upload(file, "body"); }} />}
          <p className="journal-source-tip">点击段落即可编辑 · Ctrl / ⌘ B 加粗 · Ctrl / ⌘ S 备份 · 支持粘贴与拖入图片</p>
        </section>}
        {view !== "write" && <section className="journal-preview" aria-label={isPost ? "Markdown 实时预览" : "项目预览"} aria-busy={deferred !== fields} lang="zh-CN"><div className="journal-page-label"><span>READING PROOF</span><span>与博客同版式</span></div><article className="blog-article"><ArticleDocumentHeader kind={kind} preview document={{ ...deferred, coverImage: headerCover, coverAlt: deferred.coverAlt, title: deferred.title || `未命名${noun}`, tags: documentTags(deferred.tags, deferred.source), author: isPost ? deferred.author : deferred.role, readingMinutes: estimateReadingMinutes(deferred.source) }} /><MarkdownPreview source={deferred.source} wikiLinks={wikiLinks} /></article></section>}
      </div>
    </div>
    {picker && <StudioDialog title={`切换${noun}`} onClose={() => setPicker(false)} className="journal-picker-dialog"><header className="studio-modal-heading"><div><p className="studio-kicker">YOUR JOURNAL</p><h2>选择一页，继续写。</h2></div><button type="button" aria-label="关闭内容切换" onClick={() => setPicker(false)}>×</button></header><input type="search" autoFocus aria-label="搜索文章或项目" placeholder="搜索标题…" value={query} onChange={event => setQuery(event.target.value)} /><div className="journal-picker-list"><button type="button" onClick={() => { setPicker(false); navigate("new"); }}><span className="journal-picker-icon">＋</span><span>新建{noun}<small>给新的想法留一页</small></span></button>{documents.filter(item => `${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())).map(item => <button type="button" key={item.slug} aria-current={document?.slug === item.slug ? "page" : undefined} onClick={() => { setPicker(false); navigate(item.slug); }}><span className="journal-picker-icon">{item.title.slice(0, 1)}</span><span>{item.title}<small>{item.date} · {item.tags.join(" / ")}</small></span><span aria-hidden="true">{document?.slug === item.slug ? "✓" : "↗"}</span></button>)}</div></StudioDialog>}
    {settings && <StudioDialog title="发布设置" onClose={() => setSettings(false)} className="journal-publish-dialog"><header className="studio-modal-heading"><div><p className="studio-kicker">PUBLISH TO YOUR JOURNAL</p><h2>{document ? "更新这一页" : "准备发布"}</h2></div><button type="button" aria-label="收起发布设置" onClick={() => setSettings(false)}>×</button></header><div className="journal-publish" id="document-publish-settings"><div className="journal-publish-summary"><span>{isPost ? "手记" : "作品"}</span><h3>{fields.title || "未命名"}</h3><p>{fields.description || "请在正文中补充摘要。"}</p></div>
      <fieldset disabled={busy}><legend className="sr-only">发布信息</legend><div className="journal-publish-basics">{input("date", "发布日期", { type: "date" })}<TagField value={fields.tags} onChange={value => set("tags", value)} derived={footerTags(fields.source)} suggestions={[...new Set(documents.flatMap(item => item.tags))]} disabled={busy} /></div>
      <section className="journal-cover-picker"><div><h3>目录封面 <small>可选</small></h3><p>{fields.coverImage ? "用于首页和内容目录；正文已有配图时，不会再额外插入封面。" : !isPost ? "默认取正文首图作为目录封面，不会在正文中重复插入。" : "没有封面的文章，以文字排版呈现。"}</p></div><input ref={coverInput} className="journal-file-input" type="file" accept={projectImageAccept} aria-label="上传封面" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "cover"); }} /><div className="journal-cover-actions"><button className="studio-secondary-button" type="button" disabled={uploading} onClick={() => coverInput.current?.click()}>{uploading ? "上传中…" : fields.coverImage ? "更换封面" : "选择封面"}</button>{fields.coverImage && <button type="button" className="journal-text-button" onClick={() => set("coverImage", "")}>移除封面</button>}</div></section>
      {!isPost && <label className="journal-check"><input type="checkbox" checked={fields.featured === "true"} onChange={event => set("featured", String(event.target.checked))} />在首页展示此作品</label>}
      <details className="journal-more-settings"><summary>更多设置 <span>地址、署名{!isPost ? "与首页排序" : ""}</span></summary><div className="journal-more-fields">{input("slug", "公开地址", { hint: document ? "已发布地址保持不变。" : "小写英文、数字和连字符" })}{isPost ? input("author", "作者") : input("role", "项目角色")}{input("coverImage", "封面地址")}{input("coverAlt", "图片描述")}{!isPost && <>{input("homeOrder", "首页排序", { type: "number" })}{input("titleEn", "英文项目名")}{input("descriptionEn", "英文简介")}{input("homeLabel", "首页小标签")}<label>封面排布<select value={fields.coverFit} onChange={event => set("coverFit", event.target.value)}><option value="cover">铺满图框</option><option value="contain">完整显示</option></select></label>{input("coverPosition", "封面焦点", { hint: "center 或 50% 50%" })}</>}</div></details>
      </fieldset>{showIssues && issues.length > 0 && <div className="journal-publish-issues" role="alert"><p>发布前请补充：</p><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
      {message && <p className="journal-modal-message" role="status">{message}</p>}
      <footer className="journal-publish-footer"><span>点击后公开同步到网站</span><button className="studio-button" type="button" disabled={busy || uploading} onClick={() => void publish()}>{saving ? "正在发布…" : `${document ? "更新" : "发布"}${noun}`}</button></footer>{document && <Link className="journal-public-link" href={document.href} target="_blank" rel="noreferrer">查看公开页面 ↗</Link>}</div></StudioDialog>}
    <footer className="journal-editor-status"><span><span className={`journal-state-dot${dirty ? " is-dirty" : ""}`} />{dirty ? backup || "有未发布的修改" : document ? "与已发布版本一致" : "尚未发布"}</span><span>{fields.source.length.toLocaleString("zh-CN")} 字符 · 约 {estimateReadingMinutes(fields.source)} 分钟阅读</span><button type="button" onClick={saveBackup}>备份草稿</button></footer>
    {message && !settings && <div className="journal-editor-message" role="status"><p>{message}</p>{beforeImport && <button type="button" onClick={() => { setFields(beforeImport); setBeforeImport(null); setMessage("已撤销导入。"); }}>撤销导入</button>}</div>}
  </section>;
}
