"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProjectCoverFit } from "@/lib/project-images";
import "./newspaper-spread.css";

export type EditionWork = { id: string; name: string; image: string; alt: string; coverFit: ProjectCoverFit; coverPosition: string; description: string; tag: string; href: string };
type Phase = "idle" | "preparing" | "covering" | "covered" | "revealing";

function Work({ work, active, eager }: { work: EditionWork; active: boolean; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  return <Link className={`edition-work-teaser edition-teaser-${work.id === "dreambook-realm" ? "dreambook" : work.id}`} href={work.href} data-active={active} aria-hidden={!active || undefined} inert={!active} tabIndex={active ? undefined : -1}>
    <span className="edition-teaser-image" data-cover-fit={work.coverFit}>{failed ? <span className="edition-cover-unavailable" role="img" aria-label={`${work.alt} · 封面暂不可用`}><span>THE PERSONAL JOURNAL</span><strong>{work.name}</strong><small>封面暂不可用 / COVER UNAVAILABLE</small></span> : <Image src={work.image} alt={work.alt} fill style={{ objectFit: work.coverFit, objectPosition: work.coverPosition }} sizes="(max-width: 760px) calc(100vw - 40px), 42vw" loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />}</span>
    <span className="edition-teaser-title">{work.name}<small>{work.tag}</small></span>
    <span className="edition-teaser-description">{work.description}</span>
  </Link>;
}

/** Stable paper columns; interrupted turns retarget the same CSS surfaces. */
export function NewspaperSpread({ works, zh }: { works: EditionWork[]; zh: boolean }) {
  const count = Math.max(1, Math.ceil(works.length / 2));
  const [issue, setIssue] = useState(0);
  const [requested, setRequested] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [instant, setInstant] = useState(false);
  const destination = useRef(0);
  const navigation = useRef<HTMLElement>(null);
  const shown = Math.min(issue, count - 1), selected = Math.min(requested, count - 1);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => { if (media.matches) { setInstant(true); setIssue(Math.min(destination.current, count - 1)); setPhase("idle"); } };
    media.addEventListener("change", finish);
    return () => media.removeEventListener("change", finish);
  }, [count]);
  useEffect(() => {
    let first = 0, second = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === "preparing") first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setPhase("covering")); });
    if (phase === "covering") timer = setTimeout(() => { setIssue(Math.min(destination.current, count - 1)); setPhase("covered"); }, 220);
    if (phase === "covered") first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setPhase("revealing")); });
    if (phase === "revealing") timer = setTimeout(() => setPhase("idle"), 340);
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [phase, count]);

  function turn(next: number, keyboard: boolean) {
    next = Math.max(0, Math.min(next, count - 1));
    if (next === selected && phase === "idle") return;
    destination.current = next; setRequested(next);
    const immediate = keyboard || matchMedia("(prefers-reduced-motion: reduce)").matches;
    setInstant(immediate);
    if (immediate) { setIssue(next); setPhase("idle"); return; }
    setDirection(next < shown ? "previous" : "next");
    setPhase(current => current === "idle" || current === "preparing" ? "preparing" : "covering");
  }

  return <section className="edition-featured edition-newspaper" aria-label={zh ? "精选作品报刊" : "Selected work editions"} data-phase={phase} data-direction={direction} data-instant={instant}>
    <header className="edition-spread-topline"><span>THE WORK EDITION</span><span>{zh ? `${works.length} 则作品与日常` : `${works.length} WORKS & MOMENTS`}</span></header>
    <div className="edition-spread">
      <div className="edition-spread-slot" data-side="left">{works.filter((_, index) => index % 2 === 0).map((work, index) => <Work key={`${work.id}:${work.image}`} work={work} active={index === shown} eager={index === 0} />)}<div className="edition-spread-paper" aria-hidden="true" /></div>
      <div className="edition-strip-index edition-spread-index"><h2><Link href="/projects">ALL WORK!</Link></h2><p>{zh ? <>翻开一版，<br />读一段实践。</> : <>A new edition.<br />A story of making.</>}</p>
        <nav className="edition-issue-navigation" ref={navigation} aria-label={zh ? "作品期号" : "Work edition numbers"} onKeyDown={event => {
          const keys: Record<string, number> = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: count - 1 };
          if (!(event.key in keys)) return;
          event.preventDefault(); const next = Math.max(0, Math.min(keys[event.key], count - 1)); turn(next, true);
          navigation.current?.querySelector<HTMLButtonElement>(`[data-issue="${next}"]`)?.focus({ preventScroll: true });
        }}><div className="edition-issue-numbers">{Array.from({ length: count }, (_, index) => <button key={index} type="button" data-issue={index} aria-label={zh ? `第 ${index + 1} 版` : `Edition ${index + 1}`} aria-current={selected === index ? "page" : undefined} onClick={event => turn(index, event.detail === 0)}>{String(index + 1).padStart(2, "0")}</button>)}</div><div className="edition-issue-arrows"><button type="button" className="edition-issue-button" aria-label={zh ? "上一版" : "Previous edition"} disabled={selected === 0} onClick={event => turn(selected - 1, event.detail === 0)}>←</button><button type="button" className="edition-issue-button" aria-label={zh ? "下一版" : "Next edition"} disabled={selected === count - 1} onClick={event => turn(selected + 1, event.detail === 0)}>→</button></div></nav>
        <span className="edition-issue-status" role="status" aria-live="polite">{zh ? `第 ${shown + 1} / ${count} 版` : `EDITION ${shown + 1} / ${count}`}</span>
      </div>
      <div className="edition-spread-slot" data-side="right">{works.filter((_, index) => index % 2 === 1).map((work, index) => <Work key={`${work.id}:${work.image}`} work={work} active={index === shown} eager={index === 0} />)}{works.length % 2 !== 0 && <Link href="/projects" className="edition-work-teaser edition-spread-end" data-active={shown === count - 1} inert={shown !== count - 1} aria-hidden={shown !== count - 1 || undefined} tabIndex={shown === count - 1 ? undefined : -1}><span className="edition-teaser-image"><span>TO BE<br /><em>CONTINUED.</em></span></span><span className="edition-teaser-title">{zh ? "下一页，仍在发生。" : "The next chapter."}</span><span className="edition-teaser-description">{zh ? "翻看全部作品，继续阅读背后的故事。" : "Explore the complete collection and the stories behind it."} ↗</span></Link>}<div className="edition-spread-paper" aria-hidden="true" /></div>
    </div>
  </section>;
}
