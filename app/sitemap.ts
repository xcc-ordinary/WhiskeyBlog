import type { MetadataRoute } from "next";
import { getPosts, getProjects } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap { const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"; return ["/", "/about", "/projects", "/blog", ...getProjects().map((item) => item.href), ...getPosts().map((item) => item.href)].map((href) => ({ url: new URL(href, baseUrl).toString(), lastModified: new Date() })); }
