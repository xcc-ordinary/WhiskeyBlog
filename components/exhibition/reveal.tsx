"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import type { JSX, ReactNode } from "react";

function subscribeToHydration(): () => void {
  return () => {};
}

function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }): JSX.Element {
  const reducedMotion = useReducedMotion();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated || reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, delay }}
    >
      {children}
    </motion.div>
  );
}
