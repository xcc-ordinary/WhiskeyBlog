"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useSyncExternalStore } from "react";
import type { JSX, ReactNode } from "react";

const MAX_SPEED = 0.2;
const MAX_TRAVEL_PX = 120;

function subscribeToHydration(): () => void {
  return () => {};
}

function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

function clampSpeed(speed: number): number {
  return Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed));
}

function classNames(className?: string, motionEnabled = false): string {
  return ["parallax-layer", motionEnabled && "parallax-layer-motion", className].filter(Boolean).join(" ");
}

function MotionParallax({ children, speed, className }: { children: ReactNode; speed: number; className?: string }): JSX.Element {
  const { scrollYProgress } = useScroll();
  const travel = speed * MAX_TRAVEL_PX;
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);

  return (
    <motion.div
      className={classNames(className, true)}
      data-speed={speed}
      data-testid="parallax-layer"
      style={{ y }}
    >
      {children}
    </motion.div>
  );
}

export function Parallax({ children, speed, className }: { children: ReactNode; speed: number; className?: string }): JSX.Element {
  const clampedSpeed = clampSpeed(speed);
  const reducedMotion = useReducedMotion();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated || reducedMotion) {
    return (
      <div className={classNames(className)} data-speed={clampedSpeed} data-testid="parallax-layer">
        {children}
      </div>
    );
  }

  return (
    <MotionParallax className={className} speed={clampedSpeed}>
      {children}
    </MotionParallax>
  );
}
