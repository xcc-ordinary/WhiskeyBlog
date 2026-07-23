import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { navigation, site } from "@/lib/site";
export function SiteHeader() { return <header className="site-header"><div className="site-container header-inner"><Link className="site-mark" href="/">{site.name}</Link><nav aria-label="主导航"><ul className="site-nav">{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></nav><ThemeToggle /></div></header>; }
