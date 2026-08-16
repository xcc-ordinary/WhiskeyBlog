import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

const inter = Inter({ display: "swap", subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const lora = Lora({ display: "swap", subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = { title: site.name, description: site.description };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={`${inter.variable} ${lora.variable}`} lang="zh-CN" suppressHydrationWarning><body className="editorial-shell font-sans antialiased text-gray-900"><LanguageProvider><PublicScrollBoundary><SiteHeader /><main>{children}</main><SiteFooter /></PublicScrollBoundary></LanguageProvider></body></html>;
}
