"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPublicScrollPath } from "@/lib/scroll-eligibility";
import { CoastalPageTransition } from "@/components/exhibition/coastal-page-transition";
import { EditorialHeader } from "@/components/exhibition/editorial-header";
import { SiteFooter } from "@/components/site-footer";

export function SiteVisualShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isPublicScrollPath(pathname) ? <div className="coastal-site"><CoastalPageTransition /><EditorialHeader />{children}<SiteFooter /></div> : <>{children}</>;
}
