import type { Metadata } from "next";
import { Breadcrumbs, AdSlot } from "@/components/ui";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { LatestArticles, TrendingArticles } from "@/components/blog/LatestArticles";
import { SITE } from "@/lib/site";

const seoTitle = "Trending Health Articles — Most Read This Week | BHG";
const seoDescription = "Trending health guides — most read this week: diabetes, thyroid, PCOS, nutrition, Ayurveda — social proof + FOMO + internal linking SEO + earning.";
const url = "/blog/trending";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Trending — Health Articles")}&category=${encodeURIComponent("Blog Trending")}&type=Blog`;

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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Trending" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }, { name: "Trending", item: "/blog/trending" }]}
        faqs={[
          { q: "What is trending?", a: "Most read this week — diabetes, thyroid, PCOS, nutrition, Ayurveda — social proof + FOMO, boosts CTR, dwell time, internal linking, pro SEO + digital marketing." },
          { q: "How is trending calculated?", a: "Demo: featured + trending flag + pageviews + gtag events + UTM + referral viral loop. Production uses GA4 + /api/earn/stats + /admin/earning dashboard." },
        ]}
        howTo={{ name: "How to use trending", steps: ["Visit /blog/trending for most read this week — social proof", "Read trending article + related + latest + affiliate + premium CTA", "Share via referral — viral loop 7d free + Rs50 credit + UTM", "Subscribe newsletter + push + WhatsApp for trending digest"] }}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Trending", path: "/blog/trending" }]} />
      <ItemListJsonLd items={list.map((a) => ({ name: a.title, path: `/blog/${a.slug}`, image: a.heroImage }))} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-900 to-amber-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — Social Proof + FOMO — Earning Platform — ItemList + Breadcrumb</p>
        <h1 className="font-display mt-1 text-3xl font-black">Trending — Most Read This Week — {list.length} Guides</h1>
        <p className="mt-2 max-w-2xl text-sm text-rose-100/90">Social proof + FOMO — trending articles boost CTR, dwell time, internal linking — pro SEO & digital marketing + earning via affiliate + premium + referral viral loop.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
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
          <div className="mt-6"><AdSlot slot="Trending footer" /></div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AffiliateProducts limit={4} />
          <LatestArticles limit={4} />
          <TrendingArticles limit={4} />
        </div>
      </div>
    </div>
  );
}
