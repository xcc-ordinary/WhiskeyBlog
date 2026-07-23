"use client";
import { useState } from "react";
import { nextTheme, type ThemePreference } from "@/lib/theme";
const labels: Record<ThemePreference, string> = { system: "跟随系统", light: "浅色", dark: "深色" };
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const saved = window.localStorage.getItem("theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  function changeTheme() { const next = nextTheme(theme); setTheme(next); window.localStorage.setItem("theme", next); document.documentElement.dataset.theme = next; }
  return <button aria-label="切换主题" className="theme-toggle" onClick={changeTheme}>{labels[theme]}</button>;
}
