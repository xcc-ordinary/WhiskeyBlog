"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { isPublicScrollPath } from "@/lib/scroll-eligibility";
import type { createProjectPaperTransition } from "./project-paper-transition";
import "./journal-page-transition.css";

export function CoastalPageTransition() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createProjectPaperTransition> | null>(null);
  const busy = useRef(false);
  const cleanupTransition = useRef<(() => void) | null>(null);
  const router = useRouter(), pathname = usePathname();

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let dragStart: { x: number; y: number } | null = null;
    let dragged = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    function release() {
      if (deadline) clearTimeout(deadline);
      deadline = undefined;
      delete document.documentElement.dataset.pageTransition;
      busy.current = false;
    }
    cleanupTransition.current = release;
    function pointerDown(event: PointerEvent) { dragStart = { x: event.clientX, y: event.clientY }; dragged = false; }
    function pointerUp(event: PointerEvent) { dragged = Boolean(dragStart && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 8); dragStart = null; }
    async function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || dragged || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target && link.target !== "_self" || link.hasAttribute("download")) return;
      const next = new URL(link.href, location.href);
      if (next.origin !== location.origin || next.pathname === location.pathname || !isPublicScrollPath(next.pathname)) return;
      event.preventDefault();
      if (busy.current) return;
      busy.current = true;
      document.documentElement.dataset.pageTransition = "covering";
      const href = next.pathname + next.search + next.hash;
      const originalPath = location.pathname;
      router.prefetch(href);
      try {
        if (!controller.current) {
          const { createProjectPaperTransition } = await import("./project-paper-transition");
          if (disposed) return;
          controller.current = createProjectPaperTransition(element!);
        }
        const image = link.querySelector("img");
        const title = link.querySelector(".edition-teaser-title, h2, h3")?.textContent ?? link.textContent ?? undefined;
        const imageUrl = image ? new URL(image.currentSrc || image.src, location.href) : undefined;
        const artwork = imageUrl?.origin === location.origin && imageUrl.pathname === "/_next/image" ? imageUrl.searchParams.get("url") ?? imageUrl.href : imageUrl?.href;
        await controller.current.cover({ image: artwork, title });
        if (disposed) return;
        document.documentElement.dataset.pageTransition = "covered";
        router.push(href);
        deadline = setTimeout(() => { void controller.current?.reveal().finally(release); if (location.pathname === originalPath) location.assign(href); }, 6500);
      } catch {
        release();
        void controller.current?.reveal();
        router.push(href);
      }
    }
    document.addEventListener("pointerdown", pointerDown, true);
    document.addEventListener("pointerup", pointerUp, true);
    document.addEventListener("click", click, true);
    return () => {
      disposed = true;
      document.removeEventListener("pointerdown", pointerDown, true);
      document.removeEventListener("pointerup", pointerUp, true);
      document.removeEventListener("click", click, true);
      release();
      cleanupTransition.current = null;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [router, mounted]);

  useEffect(() => {
    if (!busy.current) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cancelled) return;
      void controller.current?.reveal().finally(() => {
        cleanupTransition.current?.();
        document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
      });
    }));
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [pathname]);

  return mounted ? createPortal(<div ref={host} className="journal-page-transition" data-state="idle" aria-hidden="true" />, document.body) : null;
}
