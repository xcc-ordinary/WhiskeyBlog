"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { shouldEnhanceScroll } from "@/lib/scroll-eligibility";

const initialEnvironment = {
  hasHydrated: false,
  coarsePointer: true,
  viewportWidth: 0,
};

export function useScrollEnhancement(): boolean {
  const reducedMotion = useReducedMotion();
  const [environment, setEnvironment] = useState(initialEnvironment);

  useEffect(() => {
    const coarsePointer = window.matchMedia?.("(pointer: coarse)");
    const refresh = () =>
      setEnvironment({
        hasHydrated: true,
        coarsePointer: coarsePointer?.matches ?? false,
        viewportWidth: window.innerWidth,
      });

    refresh();
    window.addEventListener("resize", refresh);
    coarsePointer?.addEventListener?.("change", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      coarsePointer?.removeEventListener?.("change", refresh);
    };
  }, []);

  return shouldEnhanceScroll({
    ...environment,
    reducedMotion: Boolean(reducedMotion),
  });
}
