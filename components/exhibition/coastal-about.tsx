"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/language-provider";
import { SocialIconLinks } from "./social-icon-links";
import "./coastal-about.css";

export function CoastalAbout() {
  const {language}=useLanguage(),zh=language==="zh";
  const [open,setOpen]=useState<number|null>(0);
  const notes=[{title:zh?"正在自己的奥德赛时期":"IN MY ODYSSEY YEARS",copy:zh?"现在 20 出头，仍在读大学，学的是人工智能。正处于「奥德赛时期」，最近在做关于整理思绪的项目。":"I’m in my early twenties, studying artificial intelligence at university. Somewhere in my Odyssey years, I’m currently working on a project about organizing thoughts."},{title:zh?"电影、阅读，与想象中的世界":"FICTION & OTHER WORLDS",copy:zh?"我喜欢看电影：科幻、奇幻，也喜欢推理。《沙丘》《星际穿越》《奥德赛》《指环王》都在我的清单里。如果你喜欢 J. R. R. 托尔金的作品，那我们就有得聊了——精灵宝钻资深学者（没那么权威）。":"Science fiction, fantasy and mysteries: Dune, Interstellar, The Odyssey and The Lord of the Rings are on my list. If you like Tolkien, we’ll have plenty to talk about. A Silmarillion scholar (not that authoritative)."},{title:zh?"也留一点时间给普通的日常":"THE EVERYDAY MATTERS TOO",copy:zh?"我也喜欢一点文学，虽然看得不多；但如果你愿意聊起，我很乐意奉陪。MBTI 是 ENFP，SBTI 是 ATM……":"I enjoy literature too, though I haven’t read that much. If you’d like to talk about it, I’d love to join in. MBTI: ENFP. SBTI: ATM…"}];
  return <div className="coastal-about-page"><header><p>WHISKEY / A PERSONAL JOURNAL</p><h1><span aria-hidden="true">ABOUT.</span><small>{zh?"关于我，仍在远航。":"About me, still on the way."}</small></h1></header><section className="coastal-about-intro"><div className="coastal-about-portrait"><Image src="/images/coastal/whiskey-on-stage.webp" alt={zh?"Whiskey 在分享现场":"Whiskey on stage"} fill sizes="(max-width:760px) 100vw, 40vw"/></div><div><h2>{zh?"哈喽！我是 Wesley。":"HELLO, I’M WESLEY."}</h2><p>{zh?"也可以叫我 Whiskey 或 Sisyphe。":"You can also call me Whiskey or Sisyphe."}</p><p>{zh?"人工智能在读。保持好奇，也把想法慢慢做成能被使用的东西。":"An AI student, staying curious and turning ideas into things people can use."}</p><SocialIconLinks/></div></section><section className="coastal-about-notes" aria-label={zh?"个人手记":"Personal notes"}>{notes.map((note,index)=><article key={index}><button id={`about-note-title-${index}`} aria-expanded={open===index} aria-controls={`about-note-${index}`} onClick={()=>setOpen(open===index?null:index)}><span>0{index+1}</span><h2>{note.title}</h2><b aria-hidden="true">⌄</b></button><div className="coastal-about-note-content" id={`about-note-${index}`} role="region" aria-labelledby={`about-note-title-${index}`} inert={open!==index} data-open={open===index}><div><p>{note.copy}</p></div></div></article>)}</section></div>;
}
