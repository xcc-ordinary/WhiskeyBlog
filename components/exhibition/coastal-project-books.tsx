"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectSummary } from "@/lib/content";
import { useLanguage } from "@/components/language-provider";
import "./coastal-project-books.css";

export function CoastalProjectBooks({projects}:{projects:ProjectSummary[]}) {
  const [open,setOpen]=useState<string|undefined>(projects[0]?.slug);
  const {language}=useLanguage(),zh=language==="zh";
  useEffect(()=>{
    if(!open||innerWidth<=760)return;
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer=setTimeout(()=>{const book=document.getElementById(`spine-${open}`)?.parentElement;const shelf=book?.parentElement;if(!book||!shelf)return;const left=book.offsetLeft-shelf.offsetLeft;const right=left+book.offsetWidth;if(right>shelf.scrollLeft+shelf.clientWidth)shelf.scrollTo({left:right-shelf.clientWidth,behavior:reduced?"instant":"smooth"});else if(left<shelf.scrollLeft)shelf.scrollTo({left,behavior:reduced?"instant":"smooth"});},reduced?0:520);
    return()=>clearTimeout(timer);
  },[open]);
  return <section className="coastal-books-page"><div className="coastal-books-intro"><h1>ALL WORK!</h1><p>{zh?"项目、实验，以及持续建造的过程。":"Projects, experiments, and a practice still taking shape."}</p><span>{zh?"点击书脊，展开项目":"CLICK A SPINE TO OPEN A PROJECT"}</span></div><div className="coastal-books" aria-label={zh?"项目目录":"Project directory"}>{projects.map((project,index)=><article className="coastal-book" data-open={open===project.slug} key={project.slug}><button id={`spine-${project.slug}`} aria-expanded={open===project.slug} aria-controls={`book-${project.slug}`} onClick={()=>setOpen(open===project.slug?undefined:project.slug)}><span>{String(index+1).padStart(2,"0")}</span><strong>{project.title}</strong><small>{project.date.slice(0,4)}</small></button><div className="coastal-book-content" id={`book-${project.slug}`} role="region" aria-labelledby={`spine-${project.slug}`} inert={open!==project.slug}><div><Link href={project.href}><figure data-cover-fit={project.coverFit}><Image style={{objectFit:project.coverFit,objectPosition:project.coverPosition}} src={project.coverImage??"/images/placeholders/hero-editorial.svg"} alt={project.coverAlt??project.title} fill sizes="(max-width:760px) 90vw, 75vh"/></figure><span>{project.tags.join(" / ")}</span><h2>{project.title}</h2><p>{project.description}</p><b>{zh?"阅读项目":"READ THE STORY"} ↗</b></Link></div></div></article>)}</div><Link className="coastal-books-back" href="/">← {zh?"回到首页":"BACK TO THE JOURNAL"}</Link></section>;
}
