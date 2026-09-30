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
    // Old Bharat Health Guide URLs that may still be indexed → closest new page.
    const map: [string, string][] = [
      ["/health-calculators", "/tools"],
      ["/workout-builder", "/workout-planner"],
      ["/yoga-timer", "/timers"],
      ["/yoga", "/timers"],
      ["/nutrition-tracker", "/nutrition"],
      ["/thali-builder", "/nutrition"],
      ["/millet-swap", "/nutrition"],
      ["/food-database", "/nutrition"],
      ["/nutrition/:slug", "/nutrition"],
      ["/diet", "/diet-plans"],
      ["/dosha-meals", "/diet-plans"],
      ["/recipes", "/diet-plans"],
      ["/fasting-planner", "/tools/intermittent-fasting-calculator"],
      ["/india-risk", "/tools/diabetes-risk-calculator"],
      ["/mens-health", "/health-hub"],
      ["/womens-health", "/health-hub"],
      ["/mental-wellness", "/timers"],
      ["/solutions", "/health-hub"],
    ];
    return map.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
