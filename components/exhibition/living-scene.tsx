"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { SceneKind } from "./scene-presets";
import type { SceneController } from "./scene-renderer";
import styles from "./living-scene.module.css";
import "./scene-integration.css";

let paused = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => paused;
const serverSnapshot = () => false;

type LivingSceneProps = {
  image: string;
  mobileImage?: string;
  scene?: SceneKind;
  className?: string;
  controls?: boolean;
  fit?: "cover" | "fill";
  position?: string;
};

export function LivingScene({ image, mobileImage, scene = "harbor", className = "", controls = false, fit = "fill", position = "center" }: LivingSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const controller = useRef<SceneController | null>(null);
  const [state, setState] = useState("loading");
  const isPaused = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    const host = surface.current;
    const element = root.current;
    if (!host || !element || !window.matchMedia || typeof IntersectionObserver === "undefined") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 700px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let disposed = false;
    let visible = false;
    let generation = 0;
    let active = false;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      generation++;
      active = false;
      controller.current?.dispose();
      controller.current = null;
    };
    const start = async () => {
      if (disposed || active || !visible) return;
      if (reducedMotion.matches || connection?.saveData) { setState("static"); return; }
      active = true;
      const current = ++generation;
      try {
        const { createPaintingScene } = await import("./scene-renderer");
        if (disposed || current !== generation) return;
        const instance = await createPaintingScene(host, { image: mobile.matches && mobileImage ? mobileImage : image, kind: scene, fit, position, interaction: element.closest<HTMLElement>("section,footer,.studio-page,.notes-workbench") ?? element.parentElement ?? element });
        if (disposed || current !== generation) { instance.dispose(); return; }
        controller.current = instance;
        instance.setPaused(paused);
        instance.setVisible(visible && !document.hidden);
        setState("ready");
      } catch {
        if (!disposed && current === generation) { stop(); setState("fallback"); }
      }
    };
    const observe = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      clearTimeout(releaseTimer);
      if (visible) { controller.current?.setVisible(!document.hidden); void start(); }
      else {
        controller.current?.setVisible(false);
        // Do not retain a WebGL context for every chapter the visitor has passed.
        releaseTimer = setTimeout(() => { stop(); if (!disposed) setState("loading"); }, 1200);
      }
    }, { rootMargin: "120px" });
    const preferences = () => { stop(); setState(reducedMotion.matches ? "static" : "loading"); void start(); };
    const visibility = () => controller.current?.setVisible(visible && !document.hidden);
    const lost = () => { stop(); setState("fallback"); };
    host.addEventListener("scene-unavailable", lost);
    reducedMotion.addEventListener("change", preferences);
    mobile.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    observe.observe(element);
    return () => {
      disposed = true;
      clearTimeout(releaseTimer);
      observe.disconnect();
      reducedMotion.removeEventListener("change", preferences);
      mobile.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("scene-unavailable", lost);
      stop();
    };
  }, [image, mobileImage, scene, fit, position]);

  useEffect(() => { controller.current?.setPaused(isPaused); }, [isPaused]);

  return <div ref={root} className={`living-scene ${styles.root} ${className}`} data-scene={scene} data-state={state} data-paused={isPaused} data-testid="parallax-layer" style={{ backgroundImage: `url(${image})`, "--scene-mobile-image": `url(${mobileImage ?? image})`, backgroundSize: fit === "fill" ? "100% 100%" : "cover", backgroundPosition: position } as CSSProperties}>
    <div ref={surface} className={`living-scene-surface ${styles.surface}`} aria-hidden="true" />
    {controls && state === "ready" ? <div className={styles.controls} data-scene-controls>
      <span className={styles.caption}><span className={styles.indicator} data-paused={isPaused} />此刻，风正好<span className={styles.hint}>移动视线 · 轻触海面</span></span>
      <div className={styles.actions} role="group" aria-label="场景视角">
        <button type="button" aria-label="向左观察" onClick={() => controller.current?.nudge(-1)} disabled={isPaused}>‹</button>
        <button type="button" aria-label="视角归中" onClick={() => controller.current?.nudge(0)} disabled={isPaused}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="M10 1v4m0 10v4M1 10h4m10 0h4"/></svg></button>
        <button type="button" aria-label="向右观察" onClick={() => controller.current?.nudge(1)} disabled={isPaused}>›</button>
        <span className={styles.divider} />
        <button type="button" aria-label={isPaused ? "继续场景" : "暂停场景"} aria-pressed={isPaused} onClick={() => { paused = !paused; listeners.forEach((listener) => listener()); }}>
          <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">{isPaused ? <path d="m7 4 9 6-9 6z" /> : <path d="M6 4h2v12H6zm6 0h2v12h-2z" />}</svg>
        </button>
      </div>
    </div> : null}
  </div>;
}
