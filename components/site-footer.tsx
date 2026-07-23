import { site } from "@/lib/site";
export function SiteFooter() { return <footer className="site-footer"><div className="site-container footer-inner"><p>© {new Date().getFullYear()} {site.name}</p><a href="mailto:1661767494@qq.com">{site.email}</a></div></footer>; }
