"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap } from "gsap";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/language-provider";
import { site } from "@/lib/site";
import type { ProjectSummary } from "@/lib/content";
import { NewspaperSpread } from "./newspaper-spread";
import { featuredProjects } from "@/lib/featured-projects";

import { CoastalNoteCards } from "./coastal-note-cards";
import { LumiReplyPreview } from "./lumi-reply-preview";
import "./coastal-edition.css";

type Room = "dreambook" | "lumi" | "life";
export function CoastalEdition({ projects, openRoom, tone, setTone }: {projects:ProjectSummary[];openRoom:(room:Room,event:MouseEvent<HTMLButtonElement>)=>void;tone:number;setTone:(tone:number)=>void}) {
  const {language}=useLanguage();const zh=language==="zh";
  const root=useRef<HTMLDivElement>(null);
  const [intro,setIntro]=useState(false);
  useEffect(()=>{
    if(root.current)root.current.dataset.hydrated="true";
    const shell=document.querySelector(".coastal-site");
    if(!shell||document.documentElement.dataset.pageTransition||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const context=gsap.context(()=>{
      const timeline=gsap.timeline({onComplete:()=>{gsap.set(shell,{clearProps:"transform,transformOrigin"});document.body.style.overflow=previousOverflow;setIntro(false);}});
      setIntro(true);
      timeline.set(shell,{scale:.4,rotation:720,y:"25vw",transformOrigin:"50% 10%"})
        .to(shell,{y:"-18vw",duration:2,ease:"expo.inOut"})
        .to(shell,{scale:1,rotation:0,duration:2,ease:"expo.inOut"},"+=.5")
        .to(shell,{y:0,duration:1.5,ease:"expo.inOut"},"<");
      const skip=()=>timeline.progress(1);
      root.current?.addEventListener("coastal-skip-intro",skip,{once:true});
    },root);
    return()=>{context.revert();document.body.style.overflow=previousOverflow;};
  },[]);
  const dreambook=projects.find(project=>project.slug==="dreambook-realm");
  const lumi=projects.find(project=>project.slug==="lumi");
  const dreambookDescription=dreambook ? (!zh && dreambook.descriptionEn ? dreambook.descriptionEn : dreambook.description) : (zh?"五种情绪，五位角色。一个关于阅读、陪伴与想象力的进行中概念。":"Five emotions. Five characters. An evolving concept about reading, companionship and imagination.");
  const works=[...featuredProjects(projects).map(project=>({id:project.slug,name:!zh&&project.titleEn?project.titleEn:project.title,image:project.coverImage??"/images/placeholders/hero-editorial.svg",alt:project.coverAlt??project.title,coverFit:project.coverFit??"cover",coverPosition:project.coverPosition??"center",description:!zh&&project.descriptionEn?project.descriptionEn:project.description,tag:project.homeLabel??project.tags[0]??"PROJECT",href:project.href})),{id:"life",name:zh?"生活档案":"OFF SCREEN",image:"/images/coastal/whiskey-on-stage.webp",alt:zh?"Whiskey 在分享现场":"Whiskey speaking on stage",coverFit:"cover" as const,coverPosition:"50% 35%",description:zh?"从分享现场，到具体而普通的日常。":"On stage, and ordinary moments away from the screen.",tag:"JOURNAL",href:"/archive"}];
  return <div className="coastal-edition" ref={root} data-intro={intro?"playing":"complete"}>
    {intro&&createPortal(<button className="edition-skip" onClick={()=>root.current?.dispatchEvent(new Event("coastal-skip-intro"))}>{zh?"跳过入场":"Skip intro"} ↗</button>,document.body)}
    <NewspaperSpread works={works} zh={zh} />
    <h1 className="edition-masthead" id="home-title"><span>WHISKEY</span></h1>
    <section className="edition-cover" aria-label={zh?"个人刊物与创作介绍":"Personal journal and introduction"}>
      <aside className="edition-cover-profile"><p className="edition-eyebrow">THE PERSON BEHIND THE WORK</p><h2>{zh?<>保持好奇，<br/><em>去创造。</em></>:<>CURIOUS<br/><em>BY NATURE.</em></>}</h2><Link href="/about" className="edition-portrait"><Image src="/images/coastal/whiskey-on-stage.webp" alt={zh?"Whiskey 在分享现场":"Whiskey speaking on stage"} fill sizes="(max-width:760px) 40vw, 27vw"/></Link><p className="edition-dropcap">{zh?"我是 Whiskey，一名人工智能专业的学生。正在自己的「奥德赛时期」，把技术、阅读和生活里的问题，慢慢做成能被使用的东西。":"I’m Whiskey, an AI student in my Odyssey years. Turning curiosity about technology, reading and everyday life into things people can use."}</p><Link className="edition-text-link" href="/about">{zh?"认识我":"Meet the person"} ↗</Link></aside>
      <div className="edition-cover-world"><div className="edition-editorial-cover"><p>WHISKEY / A PERSONAL JOURNAL</p><h2 lang="en">IDEAS.<br/>INTO<br/><em>THINGS.</em></h2><div><span>{zh?"把好奇，做成作品。":"A practice of making things."}</span><Link href="/projects">{zh?"查看作品":"EXPLORE WORK"} ↗</Link></div></div><div className="edition-cover-statement"><span>{zh?"技术、想象力，":"TECHNOLOGY,"}</span><span>{zh?"与真实的生活。":"IMAGINATION & LIFE."}</span></div><div className="edition-world-note"><span>{zh?"关于想法、实践与日常的个人记录。":"A RECORD OF IDEAS, WORK & EVERYDAY LIFE."}</span><span>THE PERSONAL EDITION</span></div></div>
    </section>
    <section className="edition-interlude"><h2>MAKE<br/><em>WORLDS.</em></h2></section>
    {(dreambook || lumi) && <section className="edition-projects" id="selected-work" data-project-count={Number(Boolean(dreambook)) + Number(Boolean(lumi))}>
      {dreambook && <div className="edition-project-story"><div className="edition-project-topline"><h2>{zh?"接下来，翻开一页。":"UPCOMING NEXT"}</h2><p>{zh?"阅读与情绪，在同一个世界相遇。":"A new chapter in reading and companionship."}</p><span>01 / DREAMBOOK REALM</span></div><button className="edition-project-art" type="button" data-room-trigger="dreambook" aria-haspopup="dialog" onClick={event=>openRoom("dreambook",event)}><Image style={{objectFit:dreambook?.coverFit,objectPosition:dreambook?.coverPosition}} src={dreambook?.coverImage??"/images/projects/dreambook-realm-cover.png"} alt={dreambook?.coverAlt??(zh?"翻开藏梦书境项目":"Open Dreambook Realm")} fill sizes="(max-width:760px) 100vw, 62vw"/><span>{dreambook ? (zh?`翻开${dreambook.title}`:`OPEN ${dreambook.titleEn??dreambook.title}`) : (zh?"翻开藏梦书境":"OPEN THE DREAMBOOK")} ↗</span></button><p className="edition-project-description">{dreambookDescription}</p></div>}
      {lumi && <aside className="edition-project-aside"><p className="edition-eyebrow">02 / LUMI</p><h2>{zh?<>让回应<br/>更有<em>分寸。</em></>:<>A LITTLE<br/>MORE <em>CARE.</em></>}</h2><article aria-label={zh?"Lumi 交互样例":"Lumi interactive example"}><LumiReplyPreview zh={zh} tone={tone} onToneChange={setTone} groupLabel={zh?"试用 Lumi 回复语气":"Try Lumi reply tones"}/></article><button className="edition-oval-cta" data-room-trigger="lumi" aria-haspopup="dialog" onClick={event=>openRoom("lumi",event)}><span>{zh?"了解 LUMI":"MEET LUMI"}</span><b aria-hidden="true">⟶</b></button></aside>}
    </section>}
    <section className="edition-life"><div className="edition-life-heading"><span>BEYOND THE SCREEN</span><h2>{zh?<>生活，<br/><em>也在发生。</em></>:<>LIFE<br/><em>HAPPENS.</em></>}</h2><p>{zh?"精灵宝钻资深学者（没那么权威）。也记录那些普通、具体的日常。":"A Silmarillion scholar (not that authoritative). And a collector of ordinary days."}</p><button className="edition-text-link" data-room-trigger="life" onClick={event=>openRoom("life",event)}>{zh?"翻看生活档案":"Open the life archive"} ↗</button></div><button className="edition-life-image" aria-label={zh?"打开生活档案":"Open life archive"} onClick={event=>openRoom("life",event)}><Image src="/images/coastal/whiskey-everyday.webp" alt={zh?"Whiskey 的日常片段":"An everyday moment from Whiskey’s life"} fill sizes="(max-width:760px) 100vw, 60vw"/></button></section>
    <CoastalNoteCards/>
    <div className="edition-contact"><a href={`mailto:${site.email}`}><span>{zh?"让想法，开始发生。":"LET’S MAKE SOMETHING TOGETHER."} <em>{zh?"写封信":"EMAIL ME"}</em> — </span><span aria-hidden="true">{zh?"让想法，开始发生。":"LET’S MAKE SOMETHING TOGETHER."} <em>{zh?"写封信":"EMAIL ME"}</em> — </span></a></div>
    <footer className="edition-colophon"><span>WHISKEY © 2026</span><span>THE PERSONAL EDITION</span><a href={`mailto:${site.email}`}>{site.email}</a></footer>
  </div>;
}
