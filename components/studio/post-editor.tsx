"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveStudioPost, uploadStudioPostCover } from "@/app/studio/writing/actions";
import type { PostDocument, PostSummary } from "@/lib/content";

type Fields = {
  title: string;
  description: string;
  slug: string;
  date: string;
  tags: string;
  coverImage: string;
  coverAlt: string;
  source: string;
};

type WorkspaceView = "split" | "write" | "preview";

const initial: Fields = {
  title: "",
  description: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  tags: "随笔",
  coverImage: "",
  coverAlt: "",
  source: "# 新文章\n\n从这里开始写。\n\n**Markdown 会在右侧即时预览。**",
};

const fieldsFrom = (post?: PostDocument | null): Fields => post ? {
  title: post.title,
  description: post.description,
  slug: post.slug,
  date: post.date,
  tags: post.tags.join(", "),
  coverImage: post.coverImage ?? "",
  coverAlt: post.coverAlt ?? "",
  source: post.source.trim(),
} : initial;

const escape = (text: string) => text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

function preview(markdown: string) {
  return escape(markdown).split("\n").map((line) => {
    if (/^###\s/.test(line)) return `<h3>${line.slice(4)}</h3>`;
    if (/^##\s/.test(line)) return `<h2>${line.slice(3)}</h2>`;
    if (/^#\s/.test(line)) return `<h1>${line.slice(2)}</h1>`;
    if (/^>\s/.test(line)) return `<blockquote>${line.slice(2)}</blockquote>`;
    if (/^-\s/.test(line)) return `<li>${line.slice(2)}</li>`;
    if (!line.trim()) return "";
    return `<p>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>")}</p>`;
  }).join("");
}

const viewLabels: Array<{ value: WorkspaceView; label: string }> = [
  { value: "split", label: "双栏" },
  { value: "write", label: "仅写作" },
  { value: "preview", label: "仅预览" },
];

export function PostEditor({ post = null, posts = [] }: { post?: PostDocument | null; posts?: PostSummary[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(post));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<WorkspaceView>("split");
  const [isNavigating, startNavigation] = useTransition();

  // Long Notes should never block typing while the preview catches up.
  const deferredFields = useDeferredValue(fields);
  const html = useMemo(() => preview(deferredFields.source), [deferredFields.source]);
  const set = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  function openPost(slug: string) {
    const href = slug === "new" ? "/studio/writing?mode=new" : `/studio/writing?post=${encodeURIComponent(slug)}`;
    startNavigation(() => router.push(href));
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const data = new FormData();
      data.set("cover", file);
      const result = await uploadStudioPostCover(data);
      if (result.ok && result.path) {
        set("coverImage", result.path);
        setMessage("封面已上传，保存 Notes 后同步到公开页面。");
      } else {
        setMessage(result.message ?? "上传失败。");
      }
    } catch {
      setMessage("上传请求未完成，请稍后重试。");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const data = new FormData();
      Object.entries(fields).forEach(([key, value]) => data.set(key, value));
      data.set("originalSlug", post?.slug ?? "");
      const result = await saveStudioPost(data);
      setMessage(result.message);
      if (result.ok) {
        if (!post) router.replace(`/studio/writing?post=${encodeURIComponent(fields.slug)}`);
        router.refresh();
      }
    } catch {
      setMessage("保存请求未完成，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`post-editor notes-editor notes-editor-view-${view}`} aria-label="Notes 编辑器">
      <header className="notes-editor-toolbar">
        <label className="notes-editor-picker">
          <span>当前 Notes</span>
          <select aria-label="选择 Notes" disabled={isNavigating} onChange={(event) => openPost(event.target.value)} value={post?.slug ?? "new"}>
            <option value="new">＋ 新建 Notes</option>
            {posts.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
          </select>
        </label>

        <div className="notes-editor-view-switch" aria-label="编辑视图">
          {viewLabels.map((item) => (
            <button aria-pressed={view === item.value} key={item.value} onClick={() => setView(item.value)} type="button">
              {item.label}
            </button>
          ))}
        </div>

        <div className="notes-editor-toolbar-actions">
          <Link className="notes-editor-text-action" href="/studio/writing?mode=new">新建</Link>
          {post ? <Link className="notes-editor-text-action" href={post.href}>公开页面 ↗</Link> : null}
          <button className="studio-button" disabled={saving || uploading} onClick={() => void save()} type="button">
            {saving ? "保存中…" : "保存 Notes"}
          </button>
        </div>
      </header>

      <div className="notes-editor-layout">
        <aside className="notes-editor-settings" aria-label="Notes 设置">
          <div className="notes-editor-section-heading">
            <p className="studio-kicker">DOCUMENT</p>
            <h2>文章设置</h2>
          </div>
          <div className="notes-editor-meta">
            <label>标题<input value={fields.title} onChange={(event) => set("title", event.target.value)} placeholder="给 Notes 一个标题" /></label>
            <label>摘要<textarea value={fields.description} onChange={(event) => set("description", event.target.value)} placeholder="公开目录中显示的简短介绍" rows={3} /></label>
            <div className="notes-editor-meta-pair">
              <label>发布日期<input type="date" value={fields.date} onChange={(event) => set("date", event.target.value)} /></label>
              <label>标签<input value={fields.tags} onChange={(event) => set("tags", event.target.value)} placeholder="随笔, 生活" /></label>
            </div>
            <label>Slug<input readOnly={Boolean(post)} value={fields.slug} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="my-new-note" /><small>{post ? "公开地址保持不变" : "小写英文与连字符"}</small></label>
            <label>封面图片<input type="file" accept="image/*" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} /><small>{uploading ? "正在上传…" : fields.coverImage || "尚未选择封面"}</small></label>
            <label>封面替代文本<input value={fields.coverAlt} onChange={(event) => set("coverAlt", event.target.value)} placeholder="简短描述图片内容" /></label>
          </div>
        </aside>

        <div className="notes-editor-canvas">
          {view !== "preview" ? (
            <label className="notes-editor-source-pane">
              <span className="notes-editor-pane-label"><b>Markdown</b><small>{fields.source.length.toLocaleString("zh-CN")} 字符</small></span>
              <textarea aria-label="Markdown" className="post-editor-source" value={fields.source} onChange={(event) => set("source", event.target.value)} spellCheck="false" />
            </label>
          ) : null}

          {view !== "write" ? (
            <section className="post-editor-preview" aria-label="Markdown 实时预览" aria-busy={deferredFields.source !== fields.source}>
              <div className="notes-editor-pane-label"><b>实时预览</b><small>{deferredFields.source !== fields.source ? "更新中…" : "已同步"}</small></div>
              <article className="notes-preview-document">
                <p className="studio-kicker">NOTE / PREVIEW</p>
                <h2>{deferredFields.title || "未命名 Notes"}</h2>
                <p className="post-preview-description">{deferredFields.description || "文章摘要会显示在这里。"}</p>
                {deferredFields.coverImage ? <Image alt={deferredFields.coverAlt || "文章封面预览"} height={675} sizes="(max-width: 900px) 100vw, 50vw" src={deferredFields.coverImage} unoptimized width={1200} /> : null}
                <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
              </article>
            </section>
          ) : null}
        </div>
      </div>

      <footer className="notes-editor-status" aria-live="polite">
        <span>{post ? `正在编辑 / ${post.title}` : "未发布的新 Notes"}</span>
        {message ? <p>{message}</p> : <p>修改只会在点击“保存 Notes”后发布。</p>}
      </footer>
    </section>
  );
}
