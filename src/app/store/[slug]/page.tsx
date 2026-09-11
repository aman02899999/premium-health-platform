import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { DIGITAL_PRODUCTS } from "@/lib/monetization/config";
import { AdBanner, AdInArticle } from "@/components/monetization/AdComponents";
import { HealthProductRecommendations } from "@/components/monetization/HealthProductRecommendations";
import { MonetizationCTA } from "@/components/monetization/MonetizationCTA";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { LatestArticles } from "@/components/blog/LatestArticles";
import { BuyButton } from "@/components/monetization/BuyButton";
import { ProductImage } from "@/components/monetization/ProductImage";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DIGITAL_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = DIGITAL_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { title: "Product not found" };
  const title = `${product.title} — ${product.category} | BHG`.slice(0, 60);
  const desc = `${product.description} ${product.pages ? `${product.pages} pages, ${product.fileSize}` : ""} — educational PDF, secure delivery.`.slice(0, 155);
  const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent(product.title)}&category=${encodeURIComponent(product.category)}&type=Product`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/store/${slug}`, languages: { "en-IN": `${SITE.url}/store/${slug}`, en: `${SITE.url}/store/${slug}`, "x-default": `${SITE.url}/store/${slug}` } },
    openGraph: { title, description: desc, url: `${SITE.url}/store/${slug}`, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
  };
}

export default async function StoreSlugPage({ params }: Props) {
  const { slug } = await params;
  const product = DIGITAL_PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Store", href: "/store" }, { label: product.title }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Store", item: "/store" }, { name: product.title, item: `/store/${slug}` }]}
        faqs={[
          { q: `What is ${product.title}?`, a: `${product.description} ${product.pages} pages, ${product.fileSize}, ${product.format} — educational resource, not medical diagnosis. Discuss with qualified professional.` },
          { q: "How to download after purchase?", a: "Payment verified server-side via Razorpay/mock, generate expiring token 72h, limit 3 downloads, via /download/[token]. Private PDF URLs never public. Order in /orders + /my-purchases." },
        ]}
        howTo={{ name: `How to buy ${product.title}`, steps: ["View details + preview + pages + file size + author", "Click Buy — POST /api/monetization/orders with productId", "Checkout via Razorpay/mock — server verification /api/monetization/checkout/verify", "Download via secure token /download/[token] — expires 72h"] }}
      />
      <div className="mt-3 grid gap-6 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:grid-cols-[1fr_220px] md:p-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">{product.category} · {product.format} · {product.pages} pages · {product.fileSize} · Educational</p>
          <h1 className="font-display mt-1 text-3xl font-black">{product.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-amber-100/90">{product.description} No medical promises or guaranteed outcomes. Educational nutrition resource.</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-black">₹{product.price}</span>
            {product.originalPrice && <span className="text-sm line-through text-white/60">₹{product.originalPrice}</span>}
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{product.author}</span>
          </div>
        </div>
        <ProductImage
          image={product.image}
          alt={product.title}
          className="aspect-[3/4] w-full max-w-[220px] justify-self-center md:justify-self-end"
          sizes="220px"
          priority
        />
      </div>

      <div className="mt-4"><AdBanner placement="store_top" page={`/store/${slug}`} /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">What&apos;s Inside — {product.pages} Pages</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Detailed educational information — not hidden emergency info (emergency always free)</li>
              <li>Checklist, questions to ask doctor, lifestyle worksheet, food checklist, monitoring checklist</li>
              <li>References — ICMR, NIN, peer-reviewed</li>
              <li>File: {product.format}, {product.fileSize}, preview: <a href={product.previewUrl} className="font-bold text-emerald-700 underline">View Preview (2 pages sample)</a></li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/api/monetization/preview/${product.slug}`} className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50">Preview API</Link>
              <Link href="/my-purchases" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50">My Purchases</Link>
              <Link href="/orders" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold hover:bg-stone-50">Orders</Link>
            </div>
            <div className="mt-6 rounded-2xl bg-stone-900 p-5 text-white">
              <h3 className="font-bold">Secure Checkout — Payment Abstraction</h3>
              <p className="mt-1 text-xs text-stone-300">PaymentProvider abstraction: mock + razorpay. Server-side verification required. Env: RAZORPAY_KEY_ID, SECRET, WEBHOOK_SECRET, PAYMENT_PROVIDER. Never expose secrets to frontend.</p>
              <div className="mt-3 flex gap-2">
                <BuyButton productId={product.id} price={product.price} page={`/store/${product.slug}`} />
                <span className="text-[11px] text-stone-400">Demo — no real payment. Prod: Razorpay integration.</span>
              </div>
            </div>
          </div>

          <AdInArticle placement="article_middle" page={`/store/${slug}`} />
          <HealthProductRecommendations category={product.category as any} limit={2} page={`/store/${slug}`} title="Related Products — Educational" />
          <MonetizationCTA pageType="nutrition" page={`/store/${slug}`} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <LatestArticles limit={4} />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">Refund Policy — Digital Products</h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Due to instant delivery, refunds only if file defective or duplicate purchase within 24h. Contact care@bharathealthguide.in with order ID. Privacy: minimal data, no raw card storage, secure file access.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Store detail footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
