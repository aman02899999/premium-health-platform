import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const c = await getContent();
  return {
    name: c.business.name,
    short_name: c.business.shortName,
    description: c.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
