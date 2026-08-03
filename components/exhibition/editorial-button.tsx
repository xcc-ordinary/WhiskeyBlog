"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import type { JSX, ReactNode } from "react";

const MotionLink = motion.create(Link);

function subscribeToHydration(): () => void {
  return () => {};
}

function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function EditorialButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }): JSX.Element {
  const reducedMotion = useReducedMotion();
  const hasHydrated = useHasHydrated();
  const interaction = reducedMotion || variant === "secondary" ? undefined : { scale: 1.018 };
  const press = reducedMotion || variant === "secondary" ? undefined : { scale: 0.972 };
  const className = `editorial-button editorial-button-${variant}`;
  const content = <><span className="editorial-button-label">{children}</span><span className="editorial-button-arrow" aria-hidden="true">↗</span></>;

  if (!hasHydrated || reducedMotion) {
    return <Link className={className} href={href}>{content}</Link>;
  }

  return (
    <MotionLink
      className={className}
      href={href}
      whileHover={interaction}
      whileTap={press}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.55 }}
    >
      {content}
    </MotionLink>
  );
}
