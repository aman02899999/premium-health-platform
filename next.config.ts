import path from "path";
import type { NextConfig } from "next";

const REEL_FILES = [
  "./src/lib/social/fonts/*.ttf",
  "./src/lib/social/reel-audio/*.mp3",
  "./public/brand/logo-mark.png",
  "./public/library/covers/*.webp",
  "./public/gallery/*.webp",
  "./node_modules/ffmpeg-static/ffmpeg",
];

const nextConfig: NextConfig = {
  // One app, two sites: Royal Fitness Club at / and Premium Health Platform at /health.
  turbopack: { root: path.resolve(__dirname) },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  // Read with fs at runtime, so the tracer can't see them: ship them with the route.
  outputFileTracingIncludes: {
    "/api/social/post-image/[file]": ["./src/lib/social/fonts/*.ttf", "./public/brand/logo-mark.png", "./public/library/covers/*.webp"],
    "/api/social/story-image/[file]": ["./src/lib/social/fonts/*.ttf", "./public/brand/logo-mark.png", "./public/library/covers/*.webp"],
    // Reels: fonts and covers for the frames, the ffmpeg binary and any music track.
    "/api/admin/social/reel/[file]": REEL_FILES,
    "/api/cron/reel": REEL_FILES,
    "/api/cron/social": REEL_FILES,
    "/api/social/card/[file]": ["./src/lib/social/fonts/*.ttf", "./public/brand/logo-mark.png", "./public/gallery/*.webp"],
    "/api/admin/growth": REEL_FILES,
  },
  // Its binary is found on disk by path, so it must not be bundled.
  serverExternalPackages: ["ffmpeg-static"],

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
          // Structural protections only: no framing by other sites, no <base> hijack, no plugins,
          // forms post only here or to Razorpay, and http resources load over https. Scripts,
          // images, frames and connections stay open (Razorpay, AdSense, maps, Supabase).
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self' https://api.razorpay.com https://checkout.razorpay.com; upgrade-insecure-requests",
          },
          // Payment and sign-in popups keep working; other sites can't script this window.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
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
      // The store scanner reads barcodes with the camera: allowed on this one admin page only
      // (the later rule wins over the site-wide camera=()).
      {
        source: "/admin/shop",
        headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }],
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
      // Hindi lives at /hi/health/blog; /hi and /hi/health had no page and returned 404.
      ["/hi", "/hi/health/blog"],
      ["/hi/health", "/hi/health/blog"],
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
