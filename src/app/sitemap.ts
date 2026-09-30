import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";
import { CALCULATORS } from "@/lib/calculators";
import { absoluteUrl, categorySlug, publishedPosts } from "@/lib/site";
import { EXERCISES } from "@/lib/fitness/exercises";
import { DIET_PLANS } from "@/lib/fitness/diet-plans";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const posts = publishedPosts(c);
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
    ["/workout-planner", 0.8, "monthly"],
    ["/exercises", 0.8, "monthly"],
    ["/nutrition", 0.8, "monthly"],
    ["/diet-plans", 0.8, "monthly"],
    ["/timers", 0.6, "yearly"],
    ["/progress", 0.5, "yearly"],
    ["/blog", 0.8, "weekly"],
    ["/privacy", 0.2, "yearly"],
    ["/terms", 0.2, "yearly"],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: latest, priority, changeFrequency })),
    ...EXERCISES.map((e) => ({ url: absoluteUrl(`/exercises/${e.slug}`), priority: 0.6, changeFrequency: "yearly" as const })),
    ...DIET_PLANS.map((p) => ({ url: absoluteUrl(`/diet-plans/${p.slug}`), priority: 0.7, changeFrequency: "monthly" as const })),
    ...CALCULATORS.map((t) => ({ url: absoluteUrl(`/tools/${t.slug}`), priority: 0.7, changeFrequency: "yearly" as const })),
    ...[...new Set(posts.map((p) => categorySlug(p.category)))].map((s) => ({ url: absoluteUrl(`/blog/category/${s}`), priority: 0.5, changeFrequency: "weekly" as const })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updated || p.published,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      images: p.cover ? [absoluteUrl(p.cover)] : undefined,
    })),
  ];
}
