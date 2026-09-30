import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";
import { CALCULATORS } from "@/lib/calculators";
import { absoluteUrl, categorySlug, publishedPosts } from "@/lib/site";

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
    ["/blog", 0.8, "weekly"],
    ["/privacy", 0.2, "yearly"],
    ["/terms", 0.2, "yearly"],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: latest, priority, changeFrequency })),
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
