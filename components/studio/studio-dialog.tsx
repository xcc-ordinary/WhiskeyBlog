"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Native top-layer dialog: focus trap, Escape and return-to-trigger are browser managed. */
export function StudioDialog({ children, title, onClose, className = "" }: { children: ReactNode; title: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opener] = useState(() => typeof document === "undefined" ? null : document.activeElement);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; if (dialog.open && typeof dialog.close === "function") dialog.close(); queueMicrotask(() => { if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); }); };
  }, [opener]);
  return <dialog ref={ref} aria-label={title} aria-modal="true" className={`studio-modal ${className}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>{children}</dialog>;
}
