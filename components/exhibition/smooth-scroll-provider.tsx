"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { useScrollEnhancement } from "@/components/exhibition/use-scroll-enhancement";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = useScrollEnhancement();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.08,
      smoothWheel: true,
    });
    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);
    const synchronizeWithGsap = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(synchronizeWithGsap);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = lenis;
    document.documentElement.dataset.smoothScroll = "enabled";

    return () => {
      lenisRef.current = null;
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(synchronizeWithGsap);
      lenis.destroy();
      delete document.documentElement.dataset.smoothScroll;
    };
  }, [enabled]);

  const synchronizeHashTarget = useCallback(() => {
    const encodedId = window.location.hash.slice(1);
    if (!encodedId) return;

    const target = document.getElementById(decodeURIComponent(encodedId));
    if (!target) return;

    if (enabled && lenisRef.current) {
      lenisRef.current.resize();
      lenisRef.current.scrollTo(target, { force: true });
      return;
    }

    target.scrollIntoView?.({ behavior: "auto", block: "start" });
  }, [enabled]);

  useEffect(() => {
    let frame = window.requestAnimationFrame(synchronizeHashTarget);
    const scheduleSynchronization = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(synchronizeHashTarget);
    };

    window.addEventListener("hashchange", scheduleSynchronization);
    window.addEventListener("popstate", scheduleSynchronization);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scheduleSynchronization);
      window.removeEventListener("popstate", scheduleSynchronization);
    };
  }, [pathname, synchronizeHashTarget]);

  return <>{children}</>;
}
