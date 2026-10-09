import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";
import { CALCULATORS } from "@/lib/calculators";
import { absoluteUrl, categorySlug, publishedPosts } from "@/lib/site";
import { EXERCISES } from "@/lib/fitness/exercises";
import { DIET_PLANS } from "@/lib/fitness/diet-plans";
import { BOOKS } from "@/lib/library/catalog";
import { getCatalog } from "@/lib/shop/server";
import { listPosts as listShopPosts } from "@/lib/shop/store";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const posts = publishedPosts(c);
  const shop = await getCatalog();
  const shopPosts = shop.offline ? [] : await listShopPosts().catch(() => []);
  const latest = posts[0]?.updated || posts[0]?.published || new Date().toISOString();
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "weekly"],
    ["/membership", 0.9, "monthly"],
    ["/programs", 0.9, "monthly"],
    ["/contact", 0.9, "monthly"],
    ["/gallery", 0.7, "monthly"],
    ["/about", 0.7, "yearly"],
    ["/tools", 0.8, "monthly"],
    ["/health-hub", 0.8, "monthly"],
    ["/portal", 0.5, "monthly"],
    ["/workout-planner", 0.8, "monthly"],
    ["/exercises", 0.8, "monthly"],
    ["/nutrition", 0.8, "monthly"],
    ["/diet-plans", 0.8, "monthly"],
    ["/diet-chart", 0.8, "monthly"],
    ["/timers", 0.6, "yearly"],
    ["/progress", 0.5, "yearly"],
    ["/blog", 0.8, "weekly"],
    ["/library", 0.8, "monthly"],
    ["/store", 0.8, "monthly"],
    ["/privacy", 0.2, "yearly"],
    ["/terms", 0.2, "yearly"],
    ["/refund-policy", 0.2, "yearly"],
    ["/delivery-policy", 0.2, "yearly"],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: latest, priority, changeFrequency })),
    ...EXERCISES.map((e) => ({ url: absoluteUrl(`/exercises/${e.slug}`), priority: 0.6, changeFrequency: "yearly" as const })),
    ...BOOKS.map((b) => ({ url: absoluteUrl(`/library/${b.slug}`), priority: 0.6, changeFrequency: "monthly" as const })),
    ...DIET_PLANS.map((p) => ({ url: absoluteUrl(`/diet-plans/${p.slug}`), priority: 0.7, changeFrequency: "monthly" as const })),
    ...CALCULATORS.map((t) => ({ url: absoluteUrl(`/tools/${t.slug}`), priority: 0.7, changeFrequency: "yearly" as const })),
    ...[...new Set(posts.map((p) => categorySlug(p.category)))].map((s) => ({ url: absoluteUrl(`/blog/category/${s}`), priority: 0.5, changeFrequency: "weekly" as const })),
    // Royal Supplements store
    ...["/shop", "/shop/products", "/shop/combos", "/shop/blog", "/shop/policies"].map((path) => ({ url: absoluteUrl(path), priority: path === "/shop" ? 0.9 : 0.7, changeFrequency: "daily" as const })),
    ...shop.categories.map((x) => ({ url: absoluteUrl(`/shop/c/${x.slug}`), priority: 0.8, changeFrequency: "daily" as const })),
    ...shop.products.map((p) => ({ url: absoluteUrl(`/shop/p/${p.slug}`), lastModified: p.updatedAt, priority: 0.8, changeFrequency: "daily" as const, images: p.images.slice(0, 3).map((u) => (u.startsWith("http") ? u : absoluteUrl(u))) })),
    ...shop.combos.map((x) => ({ url: absoluteUrl(`/shop/combos/${x.slug}`), lastModified: x.updatedAt, priority: 0.7, changeFrequency: "daily" as const })),
    ...shopPosts.map((p) => ({ url: absoluteUrl(`/shop/blog/${p.slug}`), lastModified: p.updatedAt, priority: 0.6, changeFrequency: "monthly" as const })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updated || p.published,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      images: p.cover ? [absoluteUrl(p.cover)] : undefined,
    })),
  ];
}
