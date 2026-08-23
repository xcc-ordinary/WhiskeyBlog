import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhiskeyBlog",
    short_name: "WhiskeyBlog",
    description: "记录一名开发者持续学习与实践的个人网站。",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf7",
    theme_color: "#fdfbf7",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
