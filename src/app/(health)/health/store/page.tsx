import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { DIGITAL_PRODUCTS, AFFILIATE_PRODUCTS } from "@/health/lib/monetization/config";
import { DigitalProductCard } from "@/health/components/monetization/ProductCards";
import { AdBanner, AdSidebar } from "@/health/components/monetization/AdComponents";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { BOOKS } from "@/lib/library/catalog";
import { COMPLETE_LIBRARY_PRICE } from "@/lib/library/pricing";

const seoTitle = "Store — Health Guides, Diet Plans, Premium PDFs | Premium Health";
const seoDescription = "Digital health store: diabetes diet guide, 30-day weight plan, high-protein vegetarian, Ayurveda herbs — educational PDFs, secure delivery, Razorpay-ready.";
const url = "/health/store";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Store — Health Guides India")}&category=${encodeURIComponent("Digital Products")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function StorePage() {
  const categories = Array.from(new Set(DIGITAL_PRODUCTS.map((p) => p.category)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Store" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Store", item: "/health/store" }]}
        faqs={[
          { q: "What is in the store?", a: "Hand-picked health products on Amazon (we may earn a small commission at no extra cost to you). Our own digital guides aren't on sale yet." },
          { q: "How does delivery work?", a: "After payment verified server-side via /api/monetization/checkout/verify, we generate expiring download token 72h, download limit 3, via /download/[token]. Private PDF URLs never exposed publicly. Order tracked in /orders + /my-purchases." },
        ]}
        howTo={{ name: "How to buy a health guide", steps: ["Browse by category: Health Guides, Diet Plans, Ayurveda, Fitness", "View details + preview 2 pages + pages + file size", "Click Buy — checkout via Razorpay/mock, server-side verification", "Download via secure token /download/[token] — expires 72h, 3 downloads"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Digital Product Store — Modular Monetization — Payment Abstraction</p>
        <h1 className="font-display mt-1 text-3xl font-black">Store — Health Guides, Diet Plans, Premium PDFs — India</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Educational PDFs: diabetes diet, weight management, high-protein vegetarian, heart-healthy, Ayurveda herbs — 40-80 pages, secure delivery, Razorpay-ready, refund policy. No medical promises or guaranteed outcomes.</p>
        <div className="mt-3 flex flex-wrap gap-2">{categories.map((c) => <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{c}</span>)}</div>
      </div>

      {/* The library lives on the gym site (a different root layout, so Next does a full navigation). */}
      <Link href="/library" className="mt-4 flex flex-col gap-3 rounded-3xl border border-amber-300/40 bg-gradient-to-r from-stone-950 to-stone-800 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">New · Premium Library</span>
          <span className="font-display block text-xl font-black">{BOOKS.length} premium eBooks — fitness, yoga, nutrition, mind & health</span>
          <span className="block text-sm text-stone-300">Buy any single book, or the complete library for ₹{COMPLETE_LIBRARY_PRICE.toLocaleString("en-IN")}.</span>
        </span>
        <span className="shrink-0 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-bold text-stone-950">Browse the library →</span>
      </Link>

      <div className="mt-4"><AdBanner placement="store_top" page="/health/store" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {categories.map((cat) => {
            const products = DIGITAL_PRODUCTS.filter((p) => p.category === cat && p.active);
            return (
              <div key={cat}>
                <h2 className="text-lg font-bold">{cat} — {products.length} guides</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {products.map((p) => <DigitalProductCard key={p.id} product={p} page="/health/store" />)}
                </div>
              </div>
            );
          })}
          <div className="mt-6">
            <h2 className="text-lg font-bold">Related Affiliate Products — Contextual</h2>
            <p className="mt-1 text-xs text-stone-500">Products that may help with monitoring, education, or lifestyle management — never claims product treats disease.</p>
            <div className="mt-3"><AffiliateProducts limit={4} title="Store — Affiliate Picks" /></div>
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <AdSidebar placement="products_sidebar" page="/health/store" />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">How to Upload/Sell a PDF — Admin</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Add entry to DIGITAL_PRODUCTS in src/lib/monetization/config.ts with id, slug, title, price, pages, fileSize, format, previewUrl</li>
              <li>Upload PDF to private storage (S3, R2, etc.) — never public URL</li>
              <li>Set fileUrl env PRIVATE_PDF_BUCKET + signed URL generation in /api/monetization/download/[token]</li>
              <li>Test: /api/monetization/digital-products?limit=1 + /store + checkout + /download/[token] expiry</li>
              <li>Configure Razorpay: set RAZORPAY_KEY_ID, SECRET, WEBHOOK_SECRET in .env</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Store footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
