"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type JSX } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { navigation, site } from "@/lib/site";

export function EditorialHeader(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { content } = useLanguage();
  const links = navigation;

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  function openNavigation() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    setIsOpen(true);
    dialog.querySelector<HTMLAnchorElement>("a")?.focus();
  }

  function closeNavigation() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    document.body.style.overflow = "";
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <header className="editorial-header" id="header">
      <div className="site-container editorial-header-inner">
        <Link className="site-mark site-logo-link" href="/" aria-label={`${site.name} 首页`}>
          <span aria-hidden="true" className="site-logo-mark" />
        </Link>
        <div className="editorial-header-actions">
          <nav className="editorial-desktop-nav" aria-label="主导航">
            <ul>{links.map((item, index) => <li key={item.href}><Link className="liquid-glass-nav-link" href={item.href}>{content.navigation[index] ?? item.label}</Link></li>)}</ul>
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
          <div className="editorial-mobile-dialog-inner">
            <div className="editorial-mobile-dialog-heading">
              <span id="mobile-navigation-title">{content.mobileNavigation.title}</span>
              <button aria-label={content.mobileNavigation.close} onClick={closeNavigation} type="button">{content.mobileNavigation.close}</button>
            </div>
            <nav aria-label={content.mobileNavigation.ariaLabel}>
              <ul>{links.map((item, index) => <li key={item.href}><Link href={item.href} onClick={closeNavigation}>{content.navigation[index] ?? item.label}</Link></li>)}</ul>
            </nav>
            <div className="editorial-mobile-language"><LanguageToggle /></div>
          </div>
        </dialog>
      </div>
    </header>
  );
}
