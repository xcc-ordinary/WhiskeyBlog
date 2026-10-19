"use client";
import { useImperativeHandle, useLayoutEffect, useRef, type Ref, type TextareaHTMLAttributes } from "react";

/** Content height, including initial/imported drafts. No nested scroll or manual resize. */
export function AutoTextarea({ inputRef, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { inputRef?: Ref<HTMLTextAreaElement> }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(inputRef, () => ref.current!, []);
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input) return;
    const resize = () => { input.style.height = "0px"; input.style.height = `${input.scrollHeight}px`; };
    resize();
    let frame = 0;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => { if (input.clientWidth !== width) { width = input.clientWidth; cancelAnimationFrame(frame); frame = requestAnimationFrame(resize); } });
    let width = input.clientWidth;
    observer?.observe(input);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [props.value]);
  return <textarea {...props} rows={1} ref={ref} />;
}
