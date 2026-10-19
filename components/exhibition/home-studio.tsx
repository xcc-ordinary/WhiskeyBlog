"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useLanguage } from "@/components/language-provider";
import type { PublicArchivePhotograph } from "@/lib/public-photographs";
import type { ProjectSummary } from "@/lib/content";
import { CoastalEdition } from "./coastal-edition";
import { DreambookPreview } from "./dreambook-preview";
import { LumiReplyPreview } from "./lumi-reply-preview";
import "./home-studio.css";
import "./coastal-preview.css";

type Room = "dreambook" | "lumi" | "life";
export function HomeStudio({ photographs, projects = [] }: { photographs: PublicArchivePhotograph[]; projects?: ProjectSummary[] }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [room, setRoom] = useState<Room>("dreambook");
  const [lumiTone, setLumiTone] = useState(0);
  const named = photographs.filter(photo => photo.title !== "未命名照片");
  const photos = (named.length ? named : photographs).slice().sort((a,b) => Number(/hack|演讲|分享/i.test(b.title ?? "")) - Number(/hack|演讲|分享/i.test(a.title ?? ""))).slice(0,2);
  function openRoom(next: Room, event: MouseEvent<HTMLButtonElement>) {
    opener.current = event.currentTarget; flushSync(() => setRoom(next)); dialog.current?.showModal(); document.body.style.overflow = "hidden";
  }
  function closeRoom() { dialog.current?.close(); document.body.style.overflow = ""; opener.current?.focus(); }
  const activeProject = projects.find(project => project.slug === (room === "dreambook" ? "dreambook-realm" : "lumi"));
  const roomTitle = room === "dreambook" ? (activeProject ? (!zh && activeProject.titleEn ? activeProject.titleEn : activeProject.title) : (zh ? "藏梦书境" : "Dreambook Realm")) : room === "lumi" ? (activeProject?.title ?? "Lumi") : (zh ? "生活档案" : "Life archive");
  return <div className="home-studio summer-home summer-portal coastal-edition-host" ref={root} lang={zh ? "zh" : "en"}>
    <CoastalEdition projects={projects} openRoom={openRoom} tone={lumiTone} setTone={setLumiTone} />
    <dialog ref={dialog} data-lenis-prevent className="portal-dialog" aria-labelledby="portal-dialog-title" onCancel={event => {event.preventDefault(); closeRoom();}} onClose={() => {document.body.style.overflow=""; opener.current?.focus();}}>
      <div className="portal-dialog-frame" key={room} data-room={room}>
        <header className="portal-dialog-header"><div><p>{room === "dreambook" ? (zh ? "进行中的阅读陪伴概念" : "AN EVOLVING READING EXPERIENCE") : room === "lumi" ? (zh ? "AI 沟通陪伴 · 交互样例" : "AI COMMUNICATION · INTERACTIVE EXAMPLE") : (zh ? "作品之外，真实的日常" : "THE PERSON BEHIND THE PROJECTS")}</p><h2 id="portal-dialog-title">{roomTitle}</h2></div><button type="button" onClick={closeRoom} aria-label={zh ? "关闭预览" : "Close preview"}>×</button></header>
        {room === "dreambook" ? <article className="home-project-0"><DreambookPreview zh={zh} /><div className="portal-room-footer"><p>{activeProject ? (!zh && activeProject.descriptionEn ? activeProject.descriptionEn : activeProject.description) : (zh ? "把难以言说的情绪收进书页，在阅读与陪伴中找到出口。" : "A reading experience that gives difficult emotions somewhere to rest.")}</p><Link className="home-project-read" href="/projects/dreambook-realm" onClick={closeRoom}>{zh ? "阅读项目" : "Read the story"} ↗</Link></div></article> : room === "lumi" ? <article className="home-project-1"><div className="portal-lumi"><div className="portal-lumi-intro"><h3>{zh ? <>一句回复，<br />多一点体贴。</> : <>A little more care.<br />In every reply.</>}</h3><Image src="/images/projects/lumi-reply-mobile-v1.webp" alt={zh ? "Lumi 回复建议界面" : "Lumi reply suggestions interface"} width={240} height={470} /></div><LumiReplyPreview zh={zh} tone={lumiTone} onToneChange={setLumiTone} /></div><div className="portal-room-footer"><p>{zh ? "试着切换三种语气。这是本地预设样例，展示 Lumi 对沟通分寸的探索。" : "Try three reply styles. Local preset examples explore more thoughtful communication."}</p><Link className="home-project-read" href="/projects/lumi" onClick={closeRoom}>{zh ? "阅读项目" : "Read the story"} ↗</Link></div></article> : <div className="home-life portal-life"><div className="portal-photographs">{photos.map((photo,index) => <Link className="home-photo" href="/archive" key={photo.id} onClick={closeRoom}><Image src={photo.galleryUrl} alt={photo.alt} width={800} height={800} unoptimized /><span><small>{String(index+1).padStart(2,"0")} / {index === 0 ? (zh ? "分享现场" : "ON STAGE") : (zh ? "日常片段" : "OFF SCREEN")}</small>{photo.title?.replace(/Hackthon/gi,"Hackathon") || (zh ? "日常片刻" : "Everyday moments")}</span></Link>)}{!photos.length ? <p>{zh ? "生活档案暂时未能载入。" : "The archive is temporarily unavailable."}</p> : null}</div><div className="portal-room-footer"><p>{zh ? "分享现场，和那些普通、具体的生活片段。" : "On stage, and ordinary moments away from the screen."}</p><Link href="/archive" onClick={closeRoom}>{zh ? "查看全部影像" : "All photographs"} ↗</Link></div></div>}
      </div>
    </dialog>
  </div>;
}
