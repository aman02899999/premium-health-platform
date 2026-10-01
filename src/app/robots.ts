import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// One robots.txt for both sites: Royal Fitness Club (/) and Premium Health Platform (/health).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin", "/api/", "/account", "/auth/",
          "/health/api/", "/health/admin/", "/health/auth/", "/health/profile", "/health/login", "/health/register",
          "/health/orders", "/health/my-purchases", "/health/download/", "/health/earn",
        ],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/health/sitemap.xml")],
    host: absoluteUrl("/"),
  };
}
