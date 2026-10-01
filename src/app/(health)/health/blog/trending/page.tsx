import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, Newsletter } from "@/health/components/ui";
import { getAllEnrichedArticles } from "@/health/data/blog-enrichment";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/health/components/seo/JsonLd";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { LatestArticles, TrendingArticles } from "@/health/components/blog/LatestArticles";
import { SITE } from "@/health/lib/site";
import { AdBanner, AdRectangle } from "@/health/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/health/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/health/components/monetization/MonetizationCTA";

const seoTitle = "Trending Health Articles — Most Read This Week | Premium Health";
const seoDescription = "Trending health guides — most read this week: diabetes, thyroid, PCOS, nutrition, Ayurveda — socia.";
const url = "/health/blog/trending";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Trending — Health Articles")}&category=${encodeURIComponent("Blog Trending")}&type=Blog`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function TrendingPage() {
  const all = getAllEnrichedArticles();
  const trending = all.filter((a) => a.trending);
  const list = trending.length ? trending : all.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Blog", href: "/health/blog" }, { label: "Trending" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Blog", item: "/health/blog" }, { name: "Trending", item: "/health/blog/trending" }]}
        faqs={[
          { q: "What is trending?", a: "Most read this week — diabetes, thyroid, PCOS, nutrition, Ayurveda — social proof + FOMO, boosts CTR, dwell time, internal linking." },
          { q: "How is trending calculated?", a: "Demo: featured + trending flag + pageviews + gtag events + UTM + referral viral loop. Production uses GA4 + /api/earn/stats + /admin/earning dashboard." },
        ]}
        howTo={{ name: "How to use trending", steps: ["Open Trending to see this week's most-read guides", "Read a guide, then follow its related and latest links", "Share a guide with family — referrals get 7 days of Premium free", "Subscribe to the newsletter or WhatsApp tips for a weekly digest"] }}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/health" }, { name: "Blog", path: "/health/blog" }, { name: "Trending", path: "/health/blog/trending" }]} />
      <ItemListJsonLd items={list.map((a) => ({ name: a.title, path: `/health/blog/${a.slug}`, image: a.heroImage }))} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-900 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Social Proof + FOMO</p>
        <h1 className="font-display mt-1 text-3xl font-black">Trending — Most Read This Week — {list.length} Guides</h1>
        <p className="mt-2 max-w-2xl text-sm text-rose-100/90">Social proof + FOMO — trending articles boost CTR, dwell time, internal linking.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <Link key={a.slug} href={`/health/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="relative aspect-[16/9] w-full">
                  <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 33vw" />
                  <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white">Trending</span>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase text-rose-600">{a.category} · {a.readMinutes} min · {a.trending ? "Trending" : "Popular"}</p>
                  <h3 className="mt-1 font-bold leading-snug group-hover:text-rose-700">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-stone-300">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <HealthProductRecommendations limit={4} page="/health/blog/trending" title="Trending — Recommended" />
            <MonetizationCTA pageType="blog" page="/health/blog/trending" />
            <AdBanner placement="article_middle" page="/health/blog/trending" />
            <AdRectangle placement="article_bottom" page="/health/blog/trending" />
            <AdSlot slot="Trending footer" />
            <Newsletter compact />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdBanner placement="products_sidebar" page="/health/blog/trending" />
          <AffiliateProducts limit={4} />
          <LatestArticles limit={4} />
          <TrendingArticles limit={4} />
        </div>
      </div>
    </div>
  );
}
