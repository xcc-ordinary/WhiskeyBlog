import Link from "next/link";
import type { JSX } from "react";

import { navigation, site } from "@/lib/site";

export function EditorialHeader({ showStudio = false }: { showStudio?: boolean }): JSX.Element {
  const links = showStudio ? [...navigation, { href: "/studio", label: "Studio" }] : navigation;

  return (
    <header className="editorial-header">
      <div className="site-container editorial-header-inner">
        <Link className="site-mark" href="/" aria-label={`${site.name} 首页`}>{site.name}</Link>
        <nav className="editorial-desktop-nav" aria-label="主导航">
          <ul>{links.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
        </nav>
        <details className="editorial-mobile-index">
          <summary aria-label="Index +"><span aria-hidden="true">Index +</span></summary>
          <nav aria-label="移动导航">
            <ul>{links.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
