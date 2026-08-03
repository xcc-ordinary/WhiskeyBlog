import Link from "next/link";
import type { JSX } from "react";

import { navigation, site } from "@/lib/site";

export function EditorialFooter(): JSX.Element {
  return (
    <footer className="editorial-footer">
      <div className="site-container editorial-footer-inner">
        <div>
          <p className="section-label">LET&apos;S MAKE SOMETHING USEFUL</p>
          <h2>有想法，欢迎来信。</h2>
          <a className="editorial-contact" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <nav aria-label="页脚导航">
          <ul>{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
        </nav>
        <p className="editorial-copyright">© {new Date().getFullYear()} {site.name}</p>
      </div>
    </footer>
  );
}
