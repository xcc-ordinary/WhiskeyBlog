"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { gsap } from "gsap";

import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { navigation, site } from "@/lib/site";
import type { createPaperCurtain } from "./coastal-paper-curtain";

export function EditorialHeader(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const curtainHost = useRef<HTMLDivElement>(null);
  const curtain = useRef<ReturnType<typeof createPaperCurtain> | null>(null);
  const navigationToken = useRef(0);
  const rowMotion = useRef<gsap.core.Tween | null>(null);
  const { content, language } = useLanguage();
  const links = navigation;
  const pathname = usePathname();

  useEffect(() => () => {
    navigationToken.current++;
    curtain.current?.dispose();
    rowMotion.current?.kill();
    document.body.style.overflow = "";
  }, []);

  async function openNavigation() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    setIsOpen(true);
    dialog.querySelector<HTMLAnchorElement>("a")?.focus();
    const inner=dialog.querySelector<HTMLElement>(".editorial-mobile-dialog-inner");
    if(inner)inner.style.visibility="visible";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const token=++navigationToken.current;
    if(inner)inner.style.visibility="hidden";
    rowMotion.current?.kill();
    rowMotion.current=gsap.fromTo(dialog.querySelectorAll("nav a"),{yPercent:110},{yPercent:0,duration:1,stagger:.05,delay:1,ease:"expo.out",clearProps:"transform"});
    try {
      const {createPaperCurtain}=await import("./coastal-paper-curtain");
      if(token!==navigationToken.current||!dialog.open||!curtainHost.current)return;
      curtain.current?.dispose();curtain.current=createPaperCurtain(curtainHost.current,1);
      if(inner)inner.style.visibility="visible";
      await curtain.current.reveal();
    } catch {if(inner)inner.style.visibility="visible";}
  }

  async function closeNavigation() {
    navigationToken.current++;
    const dialog = dialogRef.current;
    rowMotion.current?.kill();
    if(dialog&&!matchMedia("(prefers-reduced-motion: reduce)").matches)rowMotion.current=gsap.to(dialog.querySelectorAll("nav a"),{yPercent:100,duration:.75,delay:.2,ease:"expo.inOut"});
    if(curtain.current&&!matchMedia("(prefers-reduced-motion: reduce)").matches)await curtain.current.cover();
    if (dialog?.open) dialog.close();
    curtain.current?.dispose();curtain.current=null;
    rowMotion.current?.kill();
    if(dialog)gsap.set(dialog.querySelectorAll("nav a"),{clearProps:"transform"});
    document.body.style.overflow = "";
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <header className="editorial-header" id="header">
      <div className="site-container editorial-header-inner">
        <Link className="site-mark site-logo-link" href="/" aria-label={`${site.name} 首页`}>
          <span className="home-wordmark" aria-hidden="true">{pathname === "/" ? "W" : "Whiskey"}<em>.</em></span><span className="coastal-wordmark-note">{language === "zh" ? "学生 · 创作者" : "STUDENT & MAKER"}</span>
        </Link>
        {!pathname.startsWith("/studio") && !pathname.startsWith("/auth") && <span className="edition-header-center">The Personal Journal</span>}
        <div className="editorial-header-actions">
          <nav className="editorial-desktop-nav" aria-label="主导航">
            <ul>{links.map((item, index) => <li key={item.href}><Link aria-current={(item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) ? "page" : undefined} className="liquid-glass-nav-link" href={item.href}>{content.navigation[index] ?? item.label}</Link></li>)}</ul>
          </nav>
          <LanguageToggle />
        </div>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          className="editorial-mobile-index liquid-glass-button"
          onClick={openNavigation}
          ref={triggerRef}
          type="button"
        >
          {content.mobileNavigation.open}
        </button>
        <dialog
          data-lenis-prevent
          aria-labelledby="mobile-navigation-title"
          aria-modal="true"
          className="editorial-mobile-dialog"
          id="mobile-navigation"
          onCancel={(event) => {
            event.preventDefault();
            closeNavigation();
          }}
          onClose={() => {
            document.body.style.overflow = "";
            triggerRef.current?.focus();
          }}
          ref={dialogRef}
          role="dialog"
        >
          <div ref={curtainHost} className="coastal-menu-curtain" aria-hidden="true" />
          <div className="editorial-mobile-dialog-inner">
            <div className="editorial-mobile-dialog-heading">
              <span id="mobile-navigation-title">{content.mobileNavigation.title}</span>
              <button aria-label={content.mobileNavigation.close} onClick={closeNavigation} type="button">{content.mobileNavigation.close}</button>
            </div>
            <nav aria-label={content.mobileNavigation.ariaLabel}>
              <ul>{links.map((item, index) => <li key={item.href}><Link href={item.href} onClick={closeNavigation}><span className="coastal-menu-index" aria-hidden="true">0{index + 1}</span>{content.navigation[index] ?? item.label}<span className="coastal-menu-arrow" aria-hidden="true">↗</span></Link></li>)}</ul>
            </nav>
            <div className="editorial-mobile-language"><LanguageToggle /></div>
          </div>
        </dialog>
      </div>
    </header>
  );
}
