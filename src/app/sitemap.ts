import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { DISEASES } from "@/data/diseases-index";
import { HERBS } from "@/data/herbs";
import { MEDICINES } from "@/data/medicines";
import { FOODS } from "@/data/nutrition";
import { LAB_TESTS, SYMPTOMS } from "@/data/clinical";
import { ARTICLES, PRODUCTS, AYURVEDA_TOPICS } from "@/data/editorial";

const STATIC_ROUTES = [
  "", "/diseases", "/solutions", "/herbs", "/medicines", "/nutrition", "/diet", "/recipes",
  "/lab-tests", "/symptoms", "/ayurveda", "/homeopathy", "/blog", "/news",
  "/products", "/health-calculators", "/search", "/yoga", "/womens-health",
  "/mens-health", "/child-health", "/mental-wellness", "/about", "/contact",
  "/privacy", "/terms", "/disclaimer", "/affiliate-disclosure",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE.url}${r || "/"}`.replace(/\/$/, "/") === `${SITE.url}/` ? `${SITE.url}/` : `${SITE.url}${r}`,
    lastModified: now,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : r === "/diseases" || r === "/blog" || r === "/news" || r === "/solutions" ? 0.9 : 0.7,
  }));
  const push = (base: string, slugs: string[], priority = 0.8) => {
    for (const s of slugs) {
      entries.push({ url: `${SITE.url}${base}/${s}`, lastModified: now, changeFrequency: "monthly", priority });
    }
  };
  push("/diseases", DISEASES.map((d) => d.slug), 0.85);
  push("/herbs", HERBS.map((h) => h.slug));
  push("/medicines", MEDICINES.map((m) => m.slug));
  push("/nutrition", FOODS.map((f) => f.slug));
  push("/lab-tests", LAB_TESTS.map((l) => l.slug));
  push("/symptoms", SYMPTOMS.map((s) => s.slug));
  push("/blog", ARTICLES.map((a) => a.slug), 0.85);
  push("/products", PRODUCTS.map((p) => p.slug), 0.5);
  push("/ayurveda", AYURVEDA_TOPICS.map((a) => a.slug));
  return entries;
}
