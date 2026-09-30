import type { Metadata } from "next";
import { Breadcrumbs, AdSlot } from "@/components/ui";
import { BlogCategoryGrid } from "@/components/blog/BlogCategories";
import { LatestArticles, TrendingArticles } from "@/components/blog/LatestArticles";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { collectionPageJsonLd } from "@/lib/seo";

const seoTitle = "Blog Categories — Disease, Nutrition, Ayurveda | BHG";
const seoDescription = "Browse health guides by category: Disease Education, Nutrition, Ayurveda, Yoga, Women's Health — SEO optimized with latest & trending, JSON-LD CollectionPage.";
const url = "/blog/category";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Blog Categories — Health Guides")}&category=${encodeURIComponent("Blog SEO")}&type=Blog`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function BlogCategoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Categories" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }, { name: "Categories", item: "/blog/category" }]}
        faqs={[
          { q: "How many blog categories?", a: "13 categories: Disease Education, Nutrition, Ayurveda, Yoga, Women's Health, Men's Health, Child Health, Mental Wellness, Lab Tests, Symptoms, Homeopathy, Products, Health Tips — each has SEO page /blog/category/[slug]." },
          { q: "How is blog SEO optimized?", a: "Each category page has CollectionPage JSON-LD, Breadcrumb, FAQ, ItemList, canonical+hreflang, OG /api/og, internal linking latest/trending/related — reduces bounce, increases dwell." },
        ]}
        howTo={{ name: "How to browse blog categories", steps: ["Pick category: e.g., Nutrition, Ayurveda, Yoga", "View articles filtered by category + trending + latest", "Read article + related internal links + affiliate + premium CTA", "Subscribe newsletter for weekly category digest"] }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd({ title: "Blog Categories", description: "Health guides by category", slug: "/blog/category", items: [{ name: "Disease Education", path: "/blog/category/disease-education" }, { name: "Nutrition", path: "/blog/category/nutrition" }] })) }} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Blog — SEO Pro — CollectionPage + ItemList JSON-LD</p>
        <h1 className="font-display mt-1 text-3xl font-black">Blog Categories — SEO Optimized — 13 Categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Every category has its own SEO page /blog/category/[slug] with JSON-LD, breadcrumbs, latest articles, internal linking — pro SEO + earning via affiliate + premium.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <BlogCategoryGrid />
          <AdSlot slot="Blog category footer" />
        </div>
        <div className="space-y-4">
          <LatestArticles limit={4} />
          <TrendingArticles limit={4} />
        </div>
      </div>
    </div>
  );
}
