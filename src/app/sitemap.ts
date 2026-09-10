import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { DISEASES } from "@/data/diseases-index";
import { HERBS } from "@/data/herbs";
import { MEDICINES } from "@/data/medicines";
import { FOODS } from "@/data/nutrition";
import { LAB_TESTS, SYMPTOMS } from "@/data/clinical";
import { ARTICLES, PRODUCTS, AYURVEDA_TOPICS } from "@/data/editorial";
import { BLOG_CATEGORIES } from "@/data/blog-enrichment";
import { DIGITAL_PRODUCTS, AFFILIATE_PRODUCTS, BUSINESS_LISTINGS } from "@/lib/monetization/config";

const STATIC_ROUTES = [
  "", "/diseases", "/solutions", "/herbs", "/medicines", "/nutrition", "/diet", "/recipes",
  "/lab-tests", "/symptoms", "/ayurveda", "/homeopathy", "/blog", "/news",
  "/products", "/health-calculators", "/search", "/yoga", "/womens-health",
  "/mens-health", "/child-health", "/mental-wellness", "/about", "/contact",
  "/privacy", "/terms", "/disclaimer", "/affiliate-disclosure",
  // Unique India pages — SEO important
  "/thali-builder", "/millet-swap", "/india-risk", "/yoga-timer", "/ritucharya",
  "/herb-interaction", "/barcode-scanner", "/child-growth", "/health-qa",
  "/live-advisory", "/dosha-meals", "/fasting-planner", "/hinglish-search",
  "/nutrition-tracker", "/workout-builder", "/food-database", "/health-search",
  "/drug-lookup", "/exercises", "/login", "/register", "/profile",
  // Marketing / earning — pro
  "/premium", "/deals", "/earn", "/lead", "/referral",
  "/blog/category", "/blog/latest", "/blog/trending", "/blog/search", "/blog/author",
  "/admin/earning",
  // Monetization platform — new earning routes (must be in sitemap per spec)
  "/affiliate-products",
  "/store",
  "/providers",
  "/newsletter",
  "/consultation",
  "/partner-with-us",
  "/advertise",
  "/orders",
  "/my-purchases",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => {
    const url = r === "" ? `${SITE.url}/` : `${SITE.url}${r}`;
    const isRoot = r === "";
    const isHigh = ["/diseases", "/blog", "/news", "/solutions", "/thali-builder", "/millet-swap", "/health-qa", "/health-search"].includes(r);
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

  push("/diseases", DISEASES.map((d) => d.slug), 0.85, "weekly");
  push("/herbs", HERBS.map((h) => h.slug), 0.75, "monthly");
  push("/medicines", MEDICINES.map((m) => m.slug), 0.75, "monthly");
  push("/nutrition", FOODS.map((f) => f.slug), 0.7, "monthly");
  push("/lab-tests", LAB_TESTS.map((l) => l.slug), 0.7, "monthly");
  push("/symptoms", SYMPTOMS.map((s) => s.slug), 0.7, "monthly");
  push("/blog", ARTICLES.map((a) => a.slug), 0.9, "weekly");
  push("/products", PRODUCTS.map((p) => p.slug), 0.6, "monthly");
  push("/ayurveda", AYURVEDA_TOPICS.map((a) => a.slug), 0.7, "monthly");
  // Monetization — store, affiliate, providers
  push("/store", DIGITAL_PRODUCTS.filter((p) => p.active).map((p) => p.slug), 0.75, "weekly");
  push("/affiliate-products", AFFILIATE_PRODUCTS.filter((p) => p.active).map((p) => p.slug), 0.6, "weekly");
  push("/providers", BUSINESS_LISTINGS.filter((p) => p.active).map((p) => p.slug), 0.6, "monthly");

  // Blog categories — SEO optimized
  for (const cat of BLOG_CATEGORIES) {
    entries.push({
      url: `${SITE.url}/blog/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Blog latest/trending filters (for SEO discovery)
  entries.push(
    { url: `${SITE.url}/blog/latest`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/blog/trending`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/blog/category`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  );

  return entries;
}
