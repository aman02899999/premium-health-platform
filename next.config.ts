import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },

  // Tree-shake barrel imports from the two heaviest icon/chart libraries.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // AUDIT FIX (defect #3): the sitemap advertised /affiliate-products/{slug} for the
  // six active affiliate products, but that route never existed — all six 404'd.
  // Their canonical pages live at /products/{slug} (same slugs in src/data/editorial.ts),
  // so legacy and previously-crawled URLs permanently redirect there (308) instead of
  // continuing to 404. Keep this list in sync with AFFILIATE_PRODUCTS in
  // src/lib/monetization/config.ts.
  async redirects() {
    const legacyAffiliateProductSlugs = [
      "digital-glucometer-combo",
      "upper-arm-bp-monitor",
      "millet-combo-pack",
      "yoga-mat-6mm",
      "whey-protein-1kg",
      "cold-pressed-mustard-oil",
    ];
    return legacyAffiliateProductSlugs.map((slug) => ({
      source: `/affiliate-products/${slug}`,
      destination: `/products/${slug}`,
      permanent: true,
    }));
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
          // Let the browser resolve Amazon/CDN hostnames before an affiliate click.
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      // Immutable fingerprinted brand assets — cache for a year.
      {
        source: "/logo.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/og-default.jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Real product photography in /public/products — content-hashed by filename.
      {
        source: "/products/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Dynamically generated OG images — short shared-cache TTL.
      {
        source: "/api/og",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" }],
      },
      // Crawler endpoints — keep them fresh but cacheable.
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/news/rss.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
    ];
  },
};

export default nextConfig;
