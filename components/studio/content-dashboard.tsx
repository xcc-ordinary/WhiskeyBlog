"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostSummary, ProjectSummary } from "@/lib/content";

export function ContentDashboard({ projects, posts, writable }: { projects: ProjectSummary[]; posts: PostSummary[]; writable: boolean }) {
  const [tab, setTab] = useState<"projects" | "writing">("projects");
  const [query, setQuery] = useState("");
  const entries = useMemo(() => (tab === "projects" ? projects : posts).filter(item => `${item.title} ${item.description} ${item.tags.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [tab, query, projects, posts]);
  return <section className="studio-dashboard">
    <header className="studio-dashboard-heading"><div><p className="studio-breadcrumb">你的创作，井然有序。</p><h1>内容管理</h1><p>编辑作品、记录想法，管理网站上的每一次更新。</p></div><Link className="studio-button" href={`/studio/${tab}?mode=new`}>＋ {tab === "projects" ? "新建项目" : "新建 Notes"}</Link></header>
    {!writable && <p className="studio-environment-notice">当前为线上只读环境。项目与 Notes 请在本地编辑后发布；照片可在线管理。</p>}
    <div className="studio-overview"><button type="button" onClick={() => { setTab("projects"); setQuery(""); }}><span>项目作品</span><strong>{projects.length}<small>个作品</small></strong><span>{projects.filter(item => item.featured).length} 个首页精选</span></button><button type="button" onClick={() => { setTab("writing"); setQuery(""); }}><span>文章 Notes</span><strong>{posts.length}<small>篇记录</small></strong><span>写作与发布</span></button><Link href="/studio/photographs" id="photographs"><span>照片资料库</span><strong>影像<span aria-hidden="true"> ↗</span></strong><span>上传、整理与公开展示</span></Link></div>
    <section className="studio-content-panel" aria-label="内容列表"><div className="studio-content-toolbar"><div className="studio-content-tabs" role="tablist" aria-label="内容类型"><button role="tab" aria-selected={tab === "projects"} onClick={() => { setTab("projects"); setQuery(""); }} type="button">项目 <small>{projects.length}</small></button><button role="tab" aria-selected={tab === "writing"} onClick={() => { setTab("writing"); setQuery(""); }} type="button">Notes <small>{posts.length}</small></button></div><input type="search" aria-label="搜索内容" placeholder="搜索标题、简介或标签…" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="studio-content-table" role="tabpanel" aria-label={tab === "projects" ? "项目列表" : "Notes 列表"}><div className="studio-content-table-head"><span>标题 / 简介</span><span>展示位置</span><span>日期</span><span>操作</span></div>{entries.map(item => <article className="studio-content-row" key={item.slug}><Link className="studio-content-identity" href={`/studio/${tab}?${tab === "projects" ? "project" : "post"}=${encodeURIComponent(item.slug)}`}>{item.coverImage?.startsWith("/") ? <Image src={item.coverImage} alt="" width={72} height={54} sizes="72px" /> : <span className="studio-content-placeholder" aria-hidden="true">{tab === "projects" ? "P" : "N"}</span>}<span><strong>{item.title}</strong><small>{item.description}</small></span></Link><span className="studio-content-location">{"featured" in item && item.featured ? "首页精选" : tab === "projects" ? "项目目录" : "Notes 目录"}</span><time dateTime={item.date}>{item.date}</time><div className="studio-content-row-actions"><Link href={`/studio/${tab}?${tab === "projects" ? "project" : "post"}=${encodeURIComponent(item.slug)}`} aria-label={`编辑${item.title}`}>编辑</Link><Link href={item.href} aria-label={`查看${item.title}`}>查看 ↗</Link></div></article>)}{!entries.length && <div className="studio-dashboard-empty"><h2>{query ? "没有匹配的内容" : "从第一篇作品开始"}</h2><p>{query ? "换一个关键词，或清空搜索。" : "新建内容后，会显示在这里。"}</p>{query && <button type="button" className="studio-secondary-button" onClick={() => setQuery("")}>清空搜索</button>}</div>}</div>
      <footer className="studio-content-panel-footer">共 {entries.length} 条{query ? "匹配内容" : "内容"}<span>点击编辑进入工作区</span></footer>
    </section>
  </section>;
}
