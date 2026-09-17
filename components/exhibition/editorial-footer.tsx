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
  const { content } = useLanguage();

  return (
    <footer className="editorial-footer signal-station-footer">
      <div className="signal-station-scrim" aria-hidden="true" />
      <div className="site-container signal-station-inner">
        <section className="signal-station-message" aria-labelledby="signal-station-title">
          <p className="signal-station-kicker">{content.footer.kicker}</p>
          <h2 id="signal-station-title">{content.footer.title}</h2>
          <a className="signal-frequency" href={`mailto:${site.email}`}>
            <span>{content.footer.frequency}</span>
            <small>{site.email}</small>
          </a>
        </section>

        <nav className="signal-station-nav" aria-label="航标导航">
          <p>{content.footer.navigation}</p>
          <ul>
            {signalNavigation.map((item, index) => {
              const current = isCurrentPath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link aria-current={current ? "page" : undefined} className={current ? "is-current" : undefined} href={item.href}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{content.navigation[index] ?? item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="signal-station-id">BUOY / {new Date().getFullYear()} / {site.name.toUpperCase()}</p>
      </div>
    </footer>
  );
}
