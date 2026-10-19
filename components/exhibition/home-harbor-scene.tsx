"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/components/language-provider";
import type { HarborController } from "./volumetric-harbor";

const subscribeReview = (listener: () => void) => { window.addEventListener("popstate", listener); return () => window.removeEventListener("popstate", listener); };
const reviewSnapshot = () => process.env.NODE_ENV === "development" && new URLSearchParams(location.search).has("frameReview");
const serverReviewSnapshot = () => false;

function ViewIcon({ kind }: { kind: "left" | "center" | "right" | "pause" | "play" }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "left" ? <path d="m14 6-6 6 6 6" /> : kind === "right" ? <path d="m10 6 6 6-6 6" /> : kind === "center" ? <><path d="M4 10a8 8 0 1 1 2 8" /><path d="M4 4v6h6" /></> : kind === "pause" ? <><path d="M8 6v12" /><path d="M16 6v12" /></> : <path d="m9 5 10 7-10 7Z" />}
  </svg>;
}

export function HomeHarborScene() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<HarborController | null>(null);
  const [state, setState] = useState("loading");
  const [paused, setPaused] = useState(false);
  const review = useSyncExternalStore(subscribeReview, reviewSnapshot, serverReviewSnapshot);
  const { language } = useLanguage();
  const zh = language === "zh";

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let disposed = false, visible = false, loading = false, generation = 0;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const release = () => { generation++; loading = false; controller.current?.dispose(); controller.current = null; };
    const start = async () => {
      if (disposed || loading || controller.current || !visible) return;
      if (motion.matches || saveData) { setState("static"); return; }
      loading = true;
      const version = ++generation;
      try {
        const { createVolumetricHarbor } = await import("./volumetric-harbor");
        if (disposed || version !== generation) return;
        const instance = await createVolumetricHarbor(element);
        if (disposed || version !== generation) { instance.dispose(); return; }
        controller.current = instance; instance.visible(visible && !document.hidden);
        setState("ready");
      } catch { if (!disposed && version === generation) setState("fallback"); }
      finally { if (version === generation) loading = false; }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; clearTimeout(releaseTimer);
      if (visible) { controller.current?.visible(!document.hidden); void start(); }
      else { controller.current?.visible(false); releaseTimer = setTimeout(() => { release(); if (!disposed) setState("loading"); }, 1200); }
    }, { rootMargin: "100px" });
    const preferences = () => { release(); setState(motion.matches ? "static" : "loading"); setPaused(false); void start(); };
    const visibility = () => controller.current?.visible(visible && !document.hidden);
    const unavailable = () => { release(); setState("fallback"); };
    observer.observe(element); motion.addEventListener("change", preferences); document.addEventListener("visibilitychange", visibility);
    element.addEventListener("harbor-unavailable", unavailable);
    return () => { disposed = true; clearTimeout(releaseTimer); observer.disconnect(); motion.removeEventListener("change", preferences); document.removeEventListener("visibilitychange", visibility); element.removeEventListener("harbor-unavailable", unavailable); release(); };
  }, []);
  useEffect(() => { controller.current?.pause(paused); }, [paused, state]);

  return <div className="home-harbor" data-state={state} data-paused={paused}>
    <div className="home-harbor-stage" ref={host} aria-hidden="true" />
    <div className="home-harbor-caption"><span><i />{zh ? "风起港湾 / 3D 手作世界" : "HARBOR / A HANDCRAFTED 3D WORLD"}</span><span>{zh ? "移动视角，走近自己的想象。" : "Shift your view. Step into an idea."}</span></div>
    {state === "ready" ? <div className="home-harbor-controls" role="group" aria-label={zh ? "场景视角" : "Scene viewpoint"}>
      <button type="button" aria-label={zh ? "向左观察" : "Look left"} title={zh ? "向左观察" : "Look left"} disabled={paused} onClick={() => controller.current?.view(-1)}><ViewIcon kind="left" /></button>
      <button type="button" aria-label={zh ? "视角归中" : "Center view"} title={zh ? "视角归中" : "Center view"} disabled={paused} onClick={() => controller.current?.view(0)}><ViewIcon kind="center" /></button>
      <button type="button" aria-label={zh ? "向右观察" : "Look right"} title={zh ? "向右观察" : "Look right"} disabled={paused} onClick={() => controller.current?.view(1)}><ViewIcon kind="right" /></button>
      <button type="button" aria-label={zh ? (paused ? "继续场景" : "暂停场景") : (paused ? "Resume scene" : "Pause scene")} title={zh ? (paused ? "继续场景" : "暂停场景") : (paused ? "Resume scene" : "Pause scene")} aria-pressed={paused} onClick={() => setPaused(value => !value)}><ViewIcon kind={paused ? "play" : "pause"} /></button>
    </div> : null}
    {review && state === "ready" ? <button className="home-frame-step" type="button" onClick={() => { setPaused(true); controller.current?.step(); }}>下一帧</button> : null}
  </div>;
}
