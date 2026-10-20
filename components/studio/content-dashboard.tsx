"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { changeStudioContentState, getStudioTrash } from "@/app/studio/content-actions";
import { StudioDialog } from "./studio-dialog";
import { matchesTagQuery } from "@/lib/content-tags";
import type { PostSummary, ProjectSummary } from "@/lib/content";

export function ContentDashboard({ projects, posts, writable }: { projects: ProjectSummary[]; posts: PostSummary[]; writable: boolean }) {
  const [tab, setTab] = useState<"projects" | "writing" | "trash">("projects");
  const [query, setQuery] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [trash, setTrash] = useState<(PostSummary | ProjectSummary)[]>([]);
  const [pending, setPending] = useState<PostSummary | ProjectSummary | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const id = (item: PostSummary | ProjectSummary) => `${item.kind}:${item.slug}`;
  const entries = useMemo(() => (tab === "trash" ? trash : (tab === "projects" ? projects : posts).filter(item => !removed.includes(`${item.kind}:${item.slug}`))).filter(item => query.startsWith("#") ? matchesTagQuery(item.tags, query) : `${item.title} ${item.description} ${item.tags.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [tab, query, projects, posts, removed, trash]);
  async function openTrash() { setWorking(true); setMessage(""); try { setTrash(await getStudioTrash()); setTab("trash"); setQuery(""); } catch { setMessage("暂时无法打开回收站，请重试。"); } finally { setWorking(false); } }
  async function change(item: PostSummary | ProjectSummary, deleted: boolean) {
    setWorking(true); setMessage("");
    try {
      const result = await changeStudioContentState(item.kind === "post" ? "posts" : "projects", item.slug, deleted);
      setMessage(result.message);
      if (result.ok) { setRemoved(current => deleted ? [...current, id(item)] : current.filter(key => key !== id(item))); setTrash(current => deleted ? [...current.filter(entry => id(entry) !== id(item)), item] : current.filter(entry => id(entry) !== id(item))); setPending(null); }
    } catch { setMessage("操作未完成，内容仍保留，请重试。"); } finally { setWorking(false); }
  }
  const editorHref = (item: PostSummary | ProjectSummary) => `/studio/${item.kind === "post" ? "writing?post=" : "projects?project="}${encodeURIComponent(item.slug)}`;
  return <section className="studio-dashboard">
    <header className="studio-dashboard-heading"><div><p className="studio-breadcrumb">你的创作，井然有序。</p><h1>内容管理</h1><p>编辑作品、记录想法，管理网站上的每一次更新。</p></div><Link className="studio-button" href={`/studio/${tab === "writing" ? "writing" : "projects"}?mode=new`}>＋ {tab === "projects" ? "新建项目" : "新建 Notes"}</Link></header>
    {!writable && <p className="studio-environment-notice">线上内容存储尚未启用。完成 Supabase 配置后即可在线编辑项目与 Notes；照片可在线管理。</p>}
    <div className="studio-overview"><button type="button" onClick={() => { setTab("projects"); setQuery(""); }}><span>项目作品</span><strong>{projects.length}<small>个作品</small></strong><span>{projects.filter(item => item.featured).length} 个首页精选</span></button><button type="button" onClick={() => { setTab("writing"); setQuery(""); }}><span>文章 Notes</span><strong>{posts.length}<small>篇记录</small></strong><span>写作与发布</span></button><Link href="/studio/photographs" id="photographs"><span>照片资料库</span><strong>影像<span aria-hidden="true"> ↗</span></strong><span>上传、整理与公开展示</span></Link></div>
    <section className="studio-content-panel" aria-label="内容列表"><div className="studio-content-toolbar"><div className="studio-content-tabs" role="tablist" aria-label="内容类型"><button role="tab" aria-selected={tab === "projects"} onClick={() => { setTab("projects"); setQuery(""); }} type="button">项目 <small>{projects.length}</small></button><button role="tab" aria-selected={tab === "writing"} onClick={() => { setTab("writing"); setQuery(""); }} type="button">Notes <small>{posts.length}</small></button><button role="tab" aria-selected={tab === "trash"} disabled={working} onClick={() => void openTrash()} type="button">回收站</button></div><input type="search" aria-label="搜索内容" placeholder="搜索标题、简介或标签…" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="studio-content-table" role="tabpanel" aria-label={tab === "trash" ? "回收站列表" : tab === "projects" ? "项目列表" : "Notes 列表"}><div className="studio-content-table-head"><span>标题 / 简介</span><span>展示位置</span><span>日期</span><span>操作</span></div>{entries.map(item => <article className="studio-content-row" key={id(item)}><Link className="studio-content-identity" href={editorHref(item)} aria-disabled={tab === "trash" || undefined} tabIndex={tab === "trash" ? -1 : undefined} onClick={event => { if (tab === "trash") event.preventDefault(); }}>{item.coverImage ? <Image src={item.coverImage} alt="" width={72} height={54} sizes="72px" /> : <span className="studio-content-placeholder" aria-hidden="true">{tab === "projects" ? "P" : "N"}</span>}<span><strong>{item.title}</strong><small>{item.description}</small></span></Link><span className="studio-content-location">{tab === "trash" ? "已移除" : "featured" in item && item.featured ? "首页精选" : tab === "projects" ? "项目目录" : "Notes 目录"}</span><time dateTime={item.date}>{item.date}</time><div className="studio-content-row-actions">{tab === "trash" ? <button type="button" disabled={working} onClick={() => void change(item, false)}>恢复</button> : <><Link href={editorHref(item)} aria-label={`编辑${item.title}`}>编辑</Link><Link href={item.href} aria-label={`查看${item.title}`}>查看 ↗</Link><button type="button" className="studio-content-remove" aria-label={`删除${item.title}`} disabled={!writable || working} onClick={() => { setMessage(""); setPending(item); }}>删除</button></>}</div></article>)}{!entries.length && <div className="studio-dashboard-empty"><h2>{query ? "没有匹配的内容" : tab === "trash" ? "回收站为空" : "从第一篇作品开始"}</h2><p>{query ? "换一个关键词，或清空搜索。" : tab === "trash" ? "移除的内容会保留在这里，供你恢复。" : "新建内容后，会显示在这里。"}</p>{query && <button type="button" className="studio-secondary-button" onClick={() => setQuery("")}>清空搜索</button>}</div>}</div>
      <footer className="studio-content-panel-footer">共 {entries.length} 条{query ? "匹配内容" : "内容"}<span>{tab === "trash" ? "恢复后回到原来的展示位置" : "点击编辑进入工作区"}</span></footer>
    </section>
    {message && !pending && <p className="studio-form-message" role="status">{message}</p>}
    {pending && <StudioDialog title="移至回收站" onClose={() => { if (!working) setPending(null); }} className="studio-trash-dialog"><header className="studio-modal-heading"><div><p className="studio-kicker">YOUR CONTENT / YOUR CONTROL</p><h2>移至回收站？</h2></div><button type="button" disabled={working} aria-label="取消删除" onClick={() => setPending(null)}>×</button></header><p className="studio-trash-title">{pending.title}</p><p>这篇内容会从网站和内容列表中隐藏。你可以在回收站恢复，上传的图片会保留。</p>{message && <p role="alert">{message}</p>}<footer className="studio-trash-actions"><button className="studio-secondary-button" type="button" disabled={working} onClick={() => setPending(null)}>保留内容</button><button className="studio-button" type="button" disabled={working} onClick={() => void change(pending, true)}>{working ? "正在移除…" : "移至回收站"}</button></footer></StudioDialog>}
  </section>;
}
