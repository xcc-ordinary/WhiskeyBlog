import type { MetadataRoute } from "next";
import { getPosts, getProjects } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const staticRoutes = ["/", "/about", "/projects", "/archive", "/blog"];
  const contentRoutes = [...getProjects(), ...getPosts()];

  return [
    ...staticRoutes.map((href) => ({
      url: new URL(href, baseUrl).toString(),
      changeFrequency: href === "/" ? "weekly" as const : "monthly" as const,
      priority: href === "/" ? 1 : 0.8,
    })),
    ...contentRoutes.map((item) => ({
      url: new URL(item.href, baseUrl).toString(),
      lastModified: item.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
