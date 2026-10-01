import type { Metadata } from "next";
import Link from "next/link";
import BlogClient from "./BlogClient";
import { getAllEnrichedArticles } from "@/health/data/blog-enrichment";
import { Breadcrumbs } from "@/health/components/ui";
import { SITE } from "@/health/lib/site";
import { itemListJsonLd, collectionPageJsonLd } from "@/health/lib/seo";
import { BlogCategories, BlogCategoryGrid } from "@/health/components/blog/BlogCategories";
import { LatestArticles, TrendingArticles, FeaturedArticles } from "@/health/components/blog/LatestArticles";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Health Blog — In-Depth Indian Guides on Diabetes, Thyroid, PCOS, Nutrition & Ayurveda",
  description: "Evidence-informed, India-specific long-form health guides: diabetes, blood pressure, thyroid, PCOS, fatty liver, anemia, yoga and Ayurveda — with real photos, FAQs and references. Browse by category, latest and trending.",
  keywords: ["Indian health blog", "diabetes guide India", "thyroid guide", "PCOS guide", "Ayurveda blog", "nutrition India", "health articles", "latest health articles", "trending health"],
  alternates: { canonical: "/health/blog", languages: { "en-IN": `${SITE.url}/health/blog`, "en": `${SITE.url}/health/blog`, "x-default": `${SITE.url}/health/blog` } },
  openGraph: {
    title: "Health Blog | Premium Health Platform",
    description: "In-depth, India-specific health guides with photos, FAQs and guideline references. Categories, latest, trending.",
    type: "website",
    url: `${SITE.url}/health/blog`,
    images: [{ url: "/health/og-default.jpg", width: 1200, height: 630, alt: "Health Blog" }],
  },
};

export default function BlogPage() {
  const articles = getAllEnrichedArticles();
  const totalFaqs = articles.reduce((n, a) => n + a.faqs.length, 0);
  const totalSections = articles.reduce((n, a) => n + a.body.length, 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Blog" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(articles.map((a) => ({ name: a.title, path: `/health/blog/${a.slug}`, image: a.heroImage })))) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd({ title: "Health Blog", description: "Indian health guides", slug: "/health/blog", items: articles.map((a) => ({ name: a.title, path: `/health/blog/${a.slug}` })) })) }} />
      <div className="mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Evidence-informed · India-specific · Fully referenced</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">Health Blog: guides worth bookmarking</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100/90">
          {`${articles.length} long-form guides · ${totalSections} detailed sections · ${totalFaqs} answered questions · real photography throughout. `}
          Browse by category, see what&apos;s new, or read what others are reading this week.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href="/health/blog/category" className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Categories →</Link>
          <Link href="/health/blog/latest" className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Latest →</Link>
          <Link href="/health/blog/trending" className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Trending →</Link>
          <Link href="/health/premium" className="rounded-full bg-amber-500 px-3 py-1.5 font-bold text-stone-900">Go Premium →</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <BlogClient articles={articles} />
          <div className="mt-8">
            <h2 className="font-display text-xl font-black">Browse by Category</h2>
            <p className="mt-1 text-sm text-stone-600">Each category has its own page with its latest guides.</p>
            <div className="mt-4"><BlogCategoryGrid /></div>
          </div>
        </div>
        <div className="space-y-4">
          <BlogCategories />
          <LatestArticles limit={5} />
          <TrendingArticles limit={5} />
          <FeaturedArticles limit={3} />
          <PremiumCTA compact />
          <AffiliateProducts limit={3} />
        </div>
      </div>
    </div>
  );
}
