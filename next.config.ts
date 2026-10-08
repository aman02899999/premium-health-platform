import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One app, two sites: Royal Fitness Club at / and Premium Health Platform at /health.
  turbopack: { root: path.resolve(__dirname) },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      // Amazon affiliate creatives (product thumbnails served by Amazon's CDN)
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
      // Private download storage — S3 and Cloudflare R2 (presigned GET URLs)
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      // Supabase Storage public buckets (store product images uploaded in admin)
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    // Two root layouts ((gym) and (health)), so unmatched URLs need a global 404 page.
    globalNotFound: true,
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        source: "/(library/covers|hero)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/(icon-192.png|icon-512.png|apple-icon.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/brand/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/gallery/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // ---- Premium Health Platform (/health) ----
      {
        source: "/health/(logo.svg|og-default.jpg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Product photos only — not the /health/products pages themselves.
        source: "/health/products/:file([^/]+\\.(?:jpg|jpeg|png|webp|avif|svg|gif))",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/health/api/og",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/health/(sitemap.xml|news/rss.xml)",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/health/admin/:path*",
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
    // Retired affiliate URLs on the health site → their product pages.
    const legacyAffiliateProductSlugs = [
      "digital-glucometer-combo",
      "upper-arm-bp-monitor",
      "millet-combo-pack",
      "yoga-mat-6mm",
      "whey-protein-1kg",
      "cold-pressed-mustard-oil",
    ];
    return [
      ...map.map(([source, destination]) => ({ source, destination, permanent: true })),
      ...legacyAffiliateProductSlugs.map((slug) => ({
        source: `/health/affiliate-products/${slug}`,
        destination: `/health/products/${slug}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
