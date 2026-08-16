import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { EditorialHeader } from "@/components/exhibition/editorial-header";
import { PublicScrollBoundary } from "@/components/exhibition/public-scroll-boundary";
import { SiteFooter } from "@/components/site-footer";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { site } from "@/lib/site";

const inter = Inter({ display: "swap", subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const lora = Lora({ display: "swap", subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = { title: site.name, description: site.description };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let isOwner = false;
  try {
    await requireOwner();
    isOwner = true;
  } catch (error) {
    if (!(error instanceof MediaStudioAuthorizationError)) throw error;
  }

  return <html className={`${inter.variable} ${lora.variable}`} lang="zh-CN" suppressHydrationWarning><body className="editorial-shell font-sans antialiased text-gray-900"><LanguageProvider><PublicScrollBoundary><EditorialHeader showStudio={isOwner} /><main>{children}</main><SiteFooter /></PublicScrollBoundary></LanguageProvider></body></html>;
}
