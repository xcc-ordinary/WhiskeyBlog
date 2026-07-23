"use client";
import { useEffect, useState } from "react";
import { nextTheme, type ThemePreference } from "@/lib/theme";
const labels: Record<ThemePreference, string> = { system: "跟随系统", light: "浅色", dark: "深色" };
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  function changeTheme() { const next = nextTheme(theme); setTheme(next); window.localStorage.setItem("theme", next); document.documentElement.dataset.theme = next; }
  return <button aria-label="切换主题" className="theme-toggle" onClick={changeTheme}>{labels[theme]}</button>;
}
