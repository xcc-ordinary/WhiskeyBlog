import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { navigation, site } from "@/lib/site";

export async function SiteHeader() {
  let isOwner = false;
  try {
    await requireOwner();
    isOwner = true;
  } catch (error) {
    if (!(error instanceof MediaStudioAuthorizationError)) throw error;
  }

  return <header className="site-header"><div className="site-container header-inner"><Link className="site-mark" href="/">{site.name}</Link><nav aria-label="主导航"><ul className="site-nav">{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}{isOwner ? <li><Link href="/studio">Studio</Link></li> : null}</ul></nav><ThemeToggle /></div></header>;
}
