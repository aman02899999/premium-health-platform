import type { MetadataRoute } from "next";
import { SITE } from "@/health/lib/site";
import { DISEASES } from "@/health/data/diseases-index";
import { HERBS } from "@/health/data/herbs";
import { MEDICINES } from "@/health/data/medicines";
import { FOODS } from "@/health/data/nutrition";
import { LAB_TESTS, SYMPTOMS } from "@/health/data/clinical";
import { ARTICLES, PRODUCTS, AYURVEDA_TOPICS } from "@/health/data/editorial";
import { BLOG_CATEGORIES } from "@/health/data/blog-enrichment";
import { getSeedNews } from "@/health/data/news";
import { DIGITAL_PRODUCTS, BUSINESS_LISTINGS } from "@/health/lib/monetization/config";

const STATIC_ROUTES = [
  "", "/health/diseases", "/health/solutions", "/health/herbs", "/health/medicines", "/health/nutrition", "/health/diet", "/health/recipes",
  "/health/lab-tests", "/health/symptoms", "/health/ayurveda", "/health/homeopathy", "/health/blog", "/health/news",
  "/health/products", "/health/health-calculators", "/health/search", "/health/yoga", "/health/womens-health",
  "/health/mens-health", "/health/child-health", "/health/mental-wellness", "/health/about", "/health/contact",
  "/health/privacy", "/health/terms", "/health/disclaimer", "/health/affiliate-disclosure",
  // Unique India pages — SEO important
  "/health/thali-builder", "/health/millet-swap", "/health/india-risk", "/health/yoga-timer", "/health/ritucharya",
  "/health/herb-interaction", "/health/barcode-scanner", "/health/child-growth", "/health/health-qa",
  "/health/live-advisory", "/health/dosha-meals", "/health/fasting-planner", "/health/hinglish-search",
  "/health/nutrition-tracker", "/health/workout-builder", "/health/food-database", "/health/health-search",
  "/health/drug-lookup", "/health/exercises", "/health/login", "/health/register", "/health/profile",
  // Marketing / earning — pro
  "/health/premium", "/health/deals", "/health/lead", "/health/referral",
  "/health/blog/search", "/health/blog/author",
  "/health/admin/earning",
  // Monetization platform — new earning routes (must be in sitemap per spec)
  "/health/affiliate-products",
  "/health/store",
  "/health/providers",
  "/health/newsletter",
  "/health/consultation",
  "/health/partner-with-us",
  "/health/advertise",
  "/health/orders",
  "/health/my-purchases",
  // Developer platform — public, indexable surfaces only.
  // /developers/dashboard is intentionally absent: it is a signed-in view with
  // robots noindex set on the page itself, so listing it here would be a lie.
  "/health/developers",
  "/health/developers/docs",
  "/health/api-directory",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => {
    const url = r === "" ? `${SITE.url}/health` : `${SITE.url}${r}`;
    const isRoot = r === "";
    const isHigh = ["/health/diseases", "/health/blog", "/health/news", "/health/solutions", "/health/thali-builder", "/health/millet-swap", "/health/health-qa", "/health/health-search"].includes(r);
    return {
      url,
      lastModified: now,
      changeFrequency: isRoot ? "daily" : isHigh ? "daily" : "weekly",
      priority: isRoot ? 1 : isHigh ? 0.9 : 0.7,
    } as MetadataRoute.Sitemap[0];
  });

  const push = (base: string, slugs: string[], priority = 0.8, freq: "daily" | "weekly" | "monthly" = "monthly") => {
    for (const s of slugs) {
      entries.push({ url: `${SITE.url}${base}/${s}`, lastModified: now, changeFrequency: freq, priority });
    }
  };

  push("/health/diseases", DISEASES.map((d) => d.slug), 0.85, "weekly");
  push("/health/herbs", HERBS.map((h) => h.slug), 0.75, "monthly");
  push("/health/medicines", MEDICINES.map((m) => m.slug), 0.75, "monthly");
  push("/health/nutrition", FOODS.map((f) => f.slug), 0.7, "monthly");
  push("/health/lab-tests", LAB_TESTS.map((l) => l.slug), 0.7, "monthly");
  push("/health/symptoms", SYMPTOMS.map((s) => s.slug), 0.7, "monthly");
  push("/health/blog", ARTICLES.map((a) => a.slug), 0.9, "weekly");
  push("/health/products", PRODUCTS.map((p) => p.slug), 0.6, "monthly");
  push("/health/ayurveda", AYURVEDA_TOPICS.map((a) => a.slug), 0.7, "monthly");
  // Monetization — store, affiliate, providers
  push("/health/store", DIGITAL_PRODUCTS.filter((p) => p.active).map((p) => p.slug), 0.75, "weekly");
  // AUDIT FIX (defect #3): /affiliate-products/{slug} has no route — every one of
  // those URLs 404'd for crawlers. Affiliate products are listed on /affiliate-products
  // (kept below) and their canonical detail pages live at /products/{slug}, which are
  // already emitted from /products above. Legacy URLs 308-redirect via next.config.ts.
  push("/health/providers", BUSINESS_LISTINGS.filter((p) => p.active).map((p) => p.slug), 0.6, "monthly");

  // News briefings — date-keyed slugs that rotate daily, so they are emitted per request.
  const newsSlugs = getSeedNews()
    .map((n) => n.slug)
    .filter((s): s is string => Boolean(s));
  push("/health/news", newsSlugs, 0.7, "daily");

  // Blog categories — SEO optimized
  for (const cat of BLOG_CATEGORIES) {
    entries.push({
      url: `${SITE.url}/health/blog/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Blog latest/trending filters (for SEO discovery)
  entries.push(
    { url: `${SITE.url}/health/blog/latest`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/health/blog/trending`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/health/blog/category`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  );

  // Duplicate <loc> entries are an SEO defect — emit each URL exactly once.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
