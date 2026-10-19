"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOutOfStudio } from "@/app/studio/actions";

const sections = [
  { href: "/studio", label: "内容总览", icon: "overview" },
  { href: "/studio/projects", label: "项目作品", icon: "project" },
  { href: "/studio/writing", label: "文章 Notes", icon: "writing" },
  { href: "/studio/photographs", label: "照片资料库", icon: "photo" },
];
function NavIcon({ type }: { type: string }) {
  const paths: Record<string, string> = { overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z", project: "M3 7V5h7l2 2h9v13H3z", writing: "M5 3h10l4 4v14H5z M9 11h6 M9 15h6 M14 3v5h5", photo: "M3 4h18v16H3z M3 16l6-6 5 5 3-3 4 4 M15 8h.01" };
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}
export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [intent, setIntent] = useState<string | null>(null);
  if (pathname === "/studio/login") return <div className="studio-admin studio-login-shell">{children}</div>;
  const active = sections.find(item => item.href !== "/studio" && pathname.startsWith(item.href)) ?? (pathname === "/studio" ? sections[0] : sections[3]);
  return <div className="studio-admin">
    <a className="studio-skip-link" href="#studio-workspace">跳到内容</a>
    <aside className="studio-sidebar"><Link className="studio-brand" href="/studio"><b>W.</b><span>Whiskey<span>内容工作台</span></span></Link><p className="studio-nav-label">工作空间</p><nav aria-label="工作台导航">{sections.map(item => <Link key={item.href} href={item.href} prefetch={item.icon === "photo" ? intent === item.href : true} onMouseEnter={() => setIntent(item.href)} onFocus={() => setIntent(item.href)} aria-current={active.href === item.href ? "page" : undefined}><NavIcon type={item.icon} />{item.label}</Link>)}</nav><div className="studio-sidebar-bottom"><Link href="/">↗ 查看网站</Link><form action={signOutOfStudio}><button type="submit">退出登录</button></form></div></aside>
    <div className="studio-workspace" id="studio-workspace"><header className="studio-topbar"><span>工作台 <span aria-hidden="true">/</span> <strong>{active.label}</strong></span><span className="studio-private-indicator">私人空间</span><div className="studio-mobile-actions"><Link href="/">查看网站 ↗</Link><form action={signOutOfStudio}><button type="submit">退出</button></form></div></header><div className="studio-workspace-content">{children}</div></div>
  </div>;
}
