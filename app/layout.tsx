import type { Metadata } from "next";
import { Inter, Lora, Noto_Serif_SC, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import "./coastal.css";
import "./coastal-paper-cards.css";
import "./visual-language.css";
import "katex/dist/katex.min.css";
import "./reading.css";
import { LanguageProvider } from "@/components/language-provider";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";
import { SiteVisualShell } from "@/components/site-visual-shell";
import { site } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

const editionDisplay = Bodoni_Moda({ display: "swap", subsets: ["latin"], variable: "--font-edition-display", weight: ["700", "900"] });
const inter = Inter({ display: "swap", subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const lora = Lora({ display: "swap", subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });
const notoSerif = Noto_Serif_SC({ display: "swap", subsets: ["latin"], variable: "--font-noto-serif", preload: false });

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
    images: ["/images/whiskey-journal-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/images/whiskey-journal-card.png"],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={`${editionDisplay.variable} ${inter.variable} ${lora.variable} ${notoSerif.variable}`} lang="zh-CN" suppressHydrationWarning><body className="editorial-shell font-sans antialiased text-gray-900"><LanguageProvider><PublicScrollBoundary><SiteVisualShell><main>{children}</main></SiteVisualShell></PublicScrollBoundary></LanguageProvider></body></html>;
}
