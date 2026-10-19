"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLanguage } from "@/components/language-provider";

// Miranda's four-paper geometry, in units of each card's own width (40 units).
const REST = [0, -22, -43, -65];
const OPEN_FIRST = [0, -1, -25, -50];
// The source shares card 1's action with card 2, leaving card 2 covered.
// Keep this navigation card anchored and open space to its right instead.
const OPEN_SECOND = [0, -22, -23, -48];
const OPEN_THIRD = [0, -22, -43, -45];

export function CoastalNoteCards() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const root = useRef<HTMLElement>(null);
  const control = useRef<(kind: "hover" | "focus", index: number | null) => void>(() => {});

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const cards = Array.from(element.querySelectorAll<HTMLAnchorElement>(":scope > a"));
    const desktop = matchMedia("(min-width:768px)");
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    let hovered: number | null = null;
    let focused: number | null = null;
    let previousGroup = "";
    let previousActive: number | null | undefined;

    const update = (immediate = false) => {
      const active = hovered ?? focused;
      const group = active === 0 ? "first" : active === 1 ? "second" : active === 2 ? "third" : "rest";
      const targets = group === "first" ? OPEN_FIRST : group === "second" ? OPEN_SECOND : group === "third" ? OPEN_THIRD : REST;
      const instant = immediate || reduced.matches || !desktop.matches;
      element.dataset.cardState = active === null ? "rest" : String(active + 1);
      if (group !== previousGroup || immediate) {
        cards.forEach((card, index) => {
          const xPercent = desktop.matches ? targets[index] * 2.5 : 0;
          // Retarget the running tween from its current position. No layout or z-index changes.
          gsap.to(card, { x: 0, xPercent, duration: instant ? 0 : (group === "rest" ? [.9, .95, 1, 1.1] : [.9, 1.1, 1, .95])[index], ease: "expo.out", overwrite: "auto" });
        });
        previousGroup = group;
      }
      if (active !== previousActive || immediate) {
        const palette = getComputedStyle(element);
        const paper = palette.getPropertyValue("--wl-paper").trim();
        const activePaper = palette.getPropertyValue("--wl-paper-active").trim();
        cards.forEach((card, index) => gsap.to(card, {
          backgroundColor: desktop.matches && index === active ? activePaper : paper,
          duration: instant ? 0 : .5, ease: "expo.out", overwrite: "auto",
        }));
        previousActive = active;
      }
    };
    control.current = (kind, index) => {
      if (kind === "hover") hovered = index;
      else { focused = index; hovered = null; }
      update();
    };
    const modeChanged = () => update(true);
    update(true);
    desktop.addEventListener("change", modeChanged);
    reduced.addEventListener("change", modeChanged);
    return () => {
      desktop.removeEventListener("change", modeChanged);
      reduced.removeEventListener("change", modeChanged);
      control.current = () => {};
      gsap.killTweensOf(cards);
    };
  }, []);

  const items = [
    { title: zh ? "写下来的思考" : "FIELD NOTES", copy: zh ? "关于技术、工具与那些尚未成形的想法。" : "Technology, tools, and ideas still taking shape.", href: "/blog" },
    { title: zh ? "正在做的事情" : "WORK IN PROGRESS", copy: zh ? "产品、实验，以及一路上的复盘。" : "Products, experiments, and what I learned along the way.", href: "/projects" },
    { title: zh ? "屏幕之外" : "OFF THE SCREEN", copy: zh ? "保留真实的现场，也保留普通的一天。" : "Keeping the real moments, on stage and off screen.", href: "/archive" },
    { title: zh ? "保持好奇的人" : "THE PERSON BEHIND IT", copy: zh ? "关于我、阅读，以及仍在远航的奥德赛时期。" : "About me, the books I read, and my Odyssey years.", href: "/about" },
  ];

  return <section className="edition-note-cards" aria-label={zh ? "探索更多" : "Explore more"} ref={root}
    onPointerLeave={() => control.current("hover", null)}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) control.current("focus", null); }}>
    {items.map((item, index) => <Link href={item.href} key={item.href}
      onPointerEnter={event => { if (event.pointerType !== "touch") control.current("hover", index); }}
      onPointerLeave={event => {
        const next = event.relatedTarget;
        if (!(next instanceof Element) || !root.current?.contains(next.closest("a"))) control.current("hover", null);
      }}
      onFocus={() => control.current("focus", index)}>
      <span>{String(index + 1).padStart(2, "0")} / WHISKEY’S JOURNAL</span>
      <h3>{item.title}</h3><p>{item.copy}</p><b aria-hidden="true">↗</b>
    </Link>)}
  </section>;
}
