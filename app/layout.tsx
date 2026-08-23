import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { EditorialHeader } from "@/components/exhibition/editorial-header";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ display: "swap", subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const lora = Lora({ display: "swap", subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  manifest: "/manifest.webmanifest",
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: ["/images/site-backgrounds/home-dieselpunk-harbor-v2.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/images/site-backgrounds/home-dieselpunk-harbor-v2.webp"],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={`${inter.variable} ${lora.variable}`} lang="zh-CN" suppressHydrationWarning><body className="editorial-shell font-sans antialiased text-gray-900"><LanguageProvider><PublicScrollBoundary><EditorialHeader /><main>{children}</main><SiteFooter /></PublicScrollBoundary></LanguageProvider></body></html>;
}
