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
    <header className="studio-masthead"><div className="studio-edition-line"><span>THE PERSONAL JOURNAL</span><span>PRIVATE EDITION / 创作工作台</span></div><div className="studio-masthead-main"><Link className="studio-wordmark" href="/studio">Whiskey<span>.</span></Link><p>把作品归档，<br />把想法写下来。</p><div className="studio-account-actions"><Link href="/" target="_blank" rel="noreferrer">查看网站 ↗</Link><form action={signOutOfStudio}><button type="submit">退出登录</button></form></div></div><nav className="studio-journal-nav" aria-label="工作台导航">{sections.map((item,index) => <Link key={item.href} href={item.href} prefetch={intent === item.href} onMouseEnter={() => setIntent(item.href)} onFocus={() => setIntent(item.href)} aria-current={active.href === item.href ? "page" : undefined}><span className="studio-nav-index">0{index+1}</span><NavIcon type={item.icon} />{item.label}</Link>)}</nav></header>
    <div className="studio-workspace" id="studio-workspace"><div className="studio-workspace-content">{children}</div></div><footer className="studio-colophon"><span>WHISKEY / THE PERSONAL JOURNAL</span><span>写作、作品与日常。</span></footer>
  </div>;
}
