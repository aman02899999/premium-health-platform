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

const seoTitle = "Latest Health Articles | Premium Health";
const seoDescription = "Latest health guides updated weekly — diabetes, thyroid, PCOS, nutrition, Ayurveda — fresh content for Google freshness signal.";
const url = "/health/blog/latest";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Latest — Health Articles")}&category=${encodeURIComponent("Blog Freshness")}&type=Blog`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function LatestPage() {
  const articles = getAllEnrichedArticles().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Blog", href: "/health/blog" }, { label: "Latest" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Blog", item: "/health/blog" }, { name: "Latest", item: "/health/blog/latest" }]}
        faqs={[
          { q: "How often is blog updated?", a: "Weekly — latest page sorted by updatedAt, Google freshness signal, 12 guides, 30+ FAQs, 50+ sections, real photography, citations PubMed/ICMR/FSSAI." },
          ]}
        howTo={{ name: "How to use latest articles", steps: ["Visit /blog/latest for fresh guides sorted by updated date", "Read article + FAQs + references + related + trending", "Subscribe newsletter + push + WhatsApp for weekly digest", "Share via referral — viral loop 7d free + Rs50 credit"] }}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/health" }, { name: "Blog", path: "/health/blog" }, { name: "Latest", path: "/health/blog/latest" }]} />
      <ItemListJsonLd items={articles.map((a) => ({ name: a.title, path: `/health/blog/${a.slug}`, image: a.heroImage }))} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Freshness Signal</p>
        <h1 className="font-display mt-1 text-3xl font-black">Latest articlesness — {articles.length} Guides Weekly</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">{articles.length} guides sorted by updated date — Google loves fresh content. Updated weekly.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/health/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                <div className="relative aspect-[16/9] w-full">
                  <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase text-emerald-600">{new Date(a.updatedAt).toLocaleDateString("en-IN")} · {a.readMinutes} min · {a.category}</p>
                  <h3 className="mt-1 font-bold leading-snug group-hover:text-emerald-700">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-stone-300">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <HealthProductRecommendations limit={4} page="/health/blog/latest" title="Recommended — Latest" />
            <MonetizationCTA pageType="blog" page="/health/blog/latest" />
            <AdBanner placement="article_middle" page="/health/blog/latest" />
            <AdRectangle placement="article_bottom" page="/health/blog/latest" />
            <AdSlot slot="Latest footer" />
            <Newsletter compact />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdBanner placement="products_sidebar" page="/health/blog/latest" />
          <AffiliateProducts limit={4} />
          <TrendingArticles limit={4} />
          <LatestArticles limit={4} />
        </div>
      </div>
    </div>
  );
}
