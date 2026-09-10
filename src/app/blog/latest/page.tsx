import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, Newsletter } from "@/components/ui";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles, TrendingArticles } from "@/components/blog/LatestArticles";
import { SITE } from "@/lib/site";
import { AdBanner, AdRectangle } from "@/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";

const seoTitle = "Latest Health Articles — Fresh SEO Content | BHG";
const seoDescription = "Latest health guides updated weekly — diabetes, thyroid, PCOS, nutrition, Ayurveda — fresh content for Google freshness signal, SEO pro + earning.";
const url = "/blog/latest";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Latest — Health Articles")}&category=${encodeURIComponent("Blog Freshness")}&type=Blog`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Latest" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }, { name: "Latest", item: "/blog/latest" }]}
        faqs={[
          { q: "How often is blog updated?", a: "Weekly — latest page sorted by updatedAt, Google freshness signal, 12 guides, 30+ FAQs, 50+ sections, real photography, citations PubMed/ICMR/FSSAI." },
          { q: "Why latest matters for SEO?", a: "Freshness + E-E-A-T + internal linking + related + trending reduces bounce, increases dwell, improves ranking for diabetes, thyroid, PCOS, nutrition queries." },
        ]}
        howTo={{ name: "How to use latest articles", steps: ["Visit /blog/latest for fresh guides sorted by updated date", "Read article + FAQs + references + related + trending", "Subscribe newsletter + push + WhatsApp for weekly digest", "Share via referral — viral loop 7d free + Rs50 credit"] }}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Latest", path: "/blog/latest" }]} />
      <ItemListJsonLd items={articles.map((a) => ({ name: a.title, path: `/blog/${a.slug}`, image: a.heroImage }))} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">SEO Pro — Freshness Signal — Earning Platform — ItemList + Breadcrumb</p>
        <h1 className="font-display mt-1 text-3xl font-black">Latest Articles — SEO Freshness — {articles.length} Guides Weekly</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">{articles.length} guides sorted by updated date — Google loves fresh content. Updated weekly. SEO: ItemList + Breadcrumb + FAQ + HowTo + OG /api/og + PremiumCTA + Affiliate.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
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
            <HealthProductRecommendations limit={4} page="/blog/latest" title="Recommended — Latest" />
            <MonetizationCTA pageType="blog" page="/blog/latest" />
            <AdBanner placement="article_middle" page="/blog/latest" />
            <AdRectangle placement="article_bottom" page="/blog/latest" />
            <AdSlot slot="Latest footer" />
            <Newsletter compact />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdBanner placement="products_sidebar" page="/blog/latest" />
          <AffiliateProducts limit={4} />
          <TrendingArticles limit={4} />
          <LatestArticles limit={4} />
        </div>
      </div>
    </div>
  );
}
