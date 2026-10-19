"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";

import { site } from "@/lib/site";
import { useLanguage } from "@/components/language-provider";

const signalNavigation = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/projects", label: "WORK" },
  { href: "/archive", label: "ARCHIVE" },
  { href: "/blog", label: "NOTES" },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function EditorialFooter(): JSX.Element {
  const pathname = usePathname();
  const { content, language } = useLanguage();

  if (pathname === "/") return <footer className="summer-footer">
    <div className="summer-footer-sky"><span>Whiskey.</span><h2>{language === "zh" ? <>保持好奇。<br />下个世界见。</> : <>Stay curious.<br />See you out there.</>}</h2><a href={`mailto:${site.email}`}>{site.email} <span aria-hidden="true">↗</span></a></div>
    <div className="summer-footer-ground"><nav aria-label="网站导航">{signalNavigation.map((item, index) => <Link key={item.href} href={item.href}>{content.navigation[index] ?? item.label}</Link>)}</nav><div><span>© {new Date().getFullYear()} WHISKEY</span><a href="#header">{language === "zh" ? "回到顶部" : "Back to top"} ↑</a></div></div>
  </footer>;

  if (!pathname.startsWith("/studio") && !pathname.startsWith("/auth")) return <footer className="coastal-footer">
    <div className="coastal-footer-main"><div><p className="coastal-kicker">{pathname === "/" ? (language === "zh" ? "关于 AI、产品，或一个还没有名字的点子。" : "ABOUT AI, PRODUCTS, OR AN IDEA WITHOUT A NAME.") : "LET’S MAKE SOMETHING GOOD"}</p><a className="coastal-contact" href={`mailto:${site.email}`}>{language === "zh" ? <>聊聊你的<br />下一个想法。</> : <>What are you<br />imagining?</>}<span aria-hidden="true">↗</span></a><a className="coastal-email" href={`mailto:${site.email}`}>{site.email}</a></div><nav aria-label="网站导航">{signalNavigation.map((item, index) => <Link key={item.href} aria-current={isCurrentPath(pathname, item.href) ? "page" : undefined} href={item.href}><span>0{index + 1}</span>{content.navigation[index] ?? item.label}</Link>)}</nav></div>
    <div className="coastal-footer-bottom"><span>WHISKEY © {new Date().getFullYear()}</span><span>{language === "zh" ? "保持好奇，留一点时间给生活。" : "Stay curious. Make room for life."}</span><a href="#header">{language === "zh" ? "回到顶部" : "Back to top"} ↑</a></div>
  </footer>;

  return <></>;
}
