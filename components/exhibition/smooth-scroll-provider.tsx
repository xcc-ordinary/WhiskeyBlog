"use client";

import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { shouldEnhanceScroll } from "@/lib/scroll-eligibility";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [environment, setEnvironment] = useState({
    hasHydrated: false,
    coarsePointer: true,
    viewportWidth: 0,
  });
  const enabled = shouldEnhanceScroll({
    ...environment,
    reducedMotion: Boolean(reducedMotion),
  });

  useEffect(() => {
    const refresh = () =>
      setEnvironment({
        hasHydrated: true,
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        viewportWidth: window.innerWidth,
      });

    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      anchors: true,
    });
    document.documentElement.dataset.smoothScroll = "enabled";

    return () => {
      lenis.destroy();
      delete document.documentElement.dataset.smoothScroll;
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [enabled, pathname]);

  return <>{children}</>;
}
