import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, AdSlot } from "@/components/ui";
import { BLOG_CATEGORIES, getAllEnrichedArticles } from "@/data/blog-enrichment";
import { LatestArticles, TrendingArticles } from "@/components/blog/LatestArticles";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/components/seo/JsonLd";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { absoluteUrl, seoTitle, seoDescription } from "@/lib/seo";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

function slugToCategory(slug: string) {
  const normalized = slug.toLowerCase().replace(/-/g, " ");
  return BLOG_CATEGORIES.find((c) => c.toLowerCase() === normalized || c.toLowerCase().replace(/\s+/g, "-") === slug);
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ slug: c.toLowerCase().replace(/\s+/g, "-") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = slugToCategory(slug);
  if (!cat) return { title: "Category not found" };
  const title = seoTitle(`${cat} — Health Guides | SEO Optimized | BHG`).slice(0, 60);
  const desc = seoDescription(`Evidence-informed ${cat} guides for Indian families: ${cat} diet, lifestyle, medicines, Ayurveda — with FAQs, references, real photos. Latest & trending, SEO pro + earning.`).slice(0, 155);
  const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent(`${cat} — Guides`)}&category=${encodeURIComponent(cat)}&type=Blog`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/category/${slug}`, languages: { "en-IN": absoluteUrl(`/blog/category/${slug}`), "en": absoluteUrl(`/blog/category/${slug}`), "x-default": absoluteUrl(`/blog/category/${slug}`) } },
    openGraph: {
      title,
      description: desc,
      type: "website",
      url: absoluteUrl(`/blog/category/${slug}`),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
    keywords: [cat, `${cat} India`, `${cat} guide`, "health blog", "Bharat Health Guide", "latest", "trending"],
  };
}

export default async function CategorySlugPage({ params }: Props) {
  const { slug } = await params;
  const cat = slugToCategory(slug);
  if (!cat) notFound();

  const all = getAllEnrichedArticles();
  const filtered = all.filter((a) => a.category === cat).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Categories", href: "/blog/category" }, { label: cat }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Blog", item: "/blog" }, { name: "Categories", item: "/blog/category" }, { name: cat, item: `/blog/category/${slug}` }]}
        faqs={[
          { q: `What is ${cat}?`, a: `${cat} guides for Indian families — evidence-informed, India-specific, with FAQs, references, real photos, diet, lifestyle, medicines, Ayurveda — SEO pro + E-E-A-T + earning via affiliate + premium.` },
          { q: `How many ${cat} guides?`, a: `${filtered.length} guides in ${cat} — sorted by updated date, latest + trending + related internal linking, CollectionPage + ItemList + Breadcrumb JSON-LD, OG /api/og, canonical+hreflang.` },
        ]}
        howTo={{ name: `How to browse ${cat} guides`, steps: [`Visit /blog/category/${slug} for all ${cat} guides`, `Read guide + FAQs + references + related + trending + latest`, `Subscribe newsletter + push + WhatsApp for weekly ${cat} digest`, `Share via referral — viral loop 7d free + Rs50 credit`] }}
      />
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Categories", path: "/blog/category" }, { name: cat, path: `/blog/category/${slug}` }]} />
      <CollectionJsonLd title={`${cat} Guides`} description={`All ${cat} articles`} slug={`/blog/category/${slug}`} items={filtered.map((a) => ({ name: a.title, path: `/blog/${a.slug}` }))} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">{filtered.length} guides · SEO optimized · CollectionPage + ItemList + Breadcrumb JSON-LD · OG /api/og · Earning Platform</p>
        <h1 className="font-display mt-2 text-3xl font-black">{cat} — Complete Guides — {filtered.length} Articles — SEO Pro</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Evidence-informed, India-specific {cat.toLowerCase()} guides with FAQs, references, real photos — latest & trending, internal linking, JSON-LD, breadcrumbs, OG /api/og, canonical+hreflang, affiliate + premium CTA — pro SEO + earning.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500">No guides yet in {cat} — check /blog/latest + /blog/trending.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                  <div className="relative aspect-[16/9] w-full">
                    <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase text-amber-600">{a.category} · {a.readMinutes} min · {new Date(a.updatedAt).toLocaleDateString("en-IN")}</p>
                    <h3 className="mt-1 font-bold leading-snug group-hover:text-emerald-700">{a.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-stone-300">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-4">
            <AffiliateProducts limit={4} title={`${cat} — Affiliate Picks`} />
            <AdSlot slot={`${cat} category footer`} />
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={5} />
          <TrendingArticles limit={4} />
          <div className="rounded-2xl bg-stone-900 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">SEO Internal Linking — Pro</p>
            <p className="mt-1 text-sm">This category page links to all {cat} guides ({filtered.length}), plus latest & trending — boosts crawlability, dwell time, topical authority, E-E-A-T, earning via affiliate + premium + referral.</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 font-bold hover:bg-white/20">All blogs →</Link>
              <Link href="/blog/latest" className="rounded-full bg-white/10 px-3 py-1 font-bold hover:bg-white/20">Latest →</Link>
              <Link href="/blog/trending" className="rounded-full bg-white/10 px-3 py-1 font-bold hover:bg-white/20">Trending →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
