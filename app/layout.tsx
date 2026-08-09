import type { Metadata } from "next";
import "./globals.css";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: site.name, description: site.description };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className="editorial-shell"><PublicScrollBoundary><SiteHeader /><main>{children}</main><SiteFooter /></PublicScrollBoundary></body></html>;
}
