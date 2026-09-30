import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/(logo.svg|icon-192.png|icon-512.png|apple-icon.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    // Old health-platform URLs that may still be indexed → closest new page.
    return [
      { source: "/health-calculators", destination: "/tools", permanent: true },
      { source: "/exercises", destination: "/programs", permanent: true },
      { source: "/workout-builder", destination: "/programs", permanent: true },
      { source: "/diet", destination: "/blog/indian-diet-plan-for-muscle-gain-vegetarian", permanent: true },
    ];
  },
};

export default nextConfig;
