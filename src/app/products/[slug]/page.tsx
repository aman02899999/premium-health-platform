import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, CheckCircle2, ExternalLink } from "lucide-react";
import { PRODUCTS, getProduct } from "@/data/editorial";
import { Breadcrumbs, ShareButtons, AdSlot, DisclaimerBar } from "@/components/ui";
import { SITE } from "@/lib/site";
import { articleJsonLd } from "@/lib/seo";
import { getProductImageForSlug } from "@/lib/monetization/config";
import { ProductImage } from "@/components/monetization/ProductImage";

export function generateStaticParams() { return PRODUCTS.map((p) => ({ slug: p.slug })); }

// The valid slug set is fixed and known at build time — anything else must 404.
// Without this, unknown slugs are rendered on demand, and because the root
// loading.tsx streams the response shell with a 200 before notFound() throws,
// they were served as soft 404s (HTTP 200 with "not found" content).
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Product not found" };
  return { title: `${p.name} — Benefits, Limitations & Price (Demo)`, description: p.short, alternates: { canonical: `/products/${slug}` } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const productImage = getProductImageForSlug(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: p.name }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: p.name, description: p.short, slug: `/products/${slug}`, category: p.category })) }} />

      <div className="mt-3 grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 md:grid-cols-2 dark:border-stone-700 dark:bg-stone-900">
        {productImage ? (
          <ProductImage
            image={productImage}
            alt={p.name}
            className="min-h-56 aspect-[4/3] w-full"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="article-grid-bg flex min-h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 p-6 dark:from-stone-800">
            <ShoppingBag className="h-16 w-16 text-emerald-700/30" />
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{p.category} · Demo product</p>
          <h1 className="font-display mt-1 text-2xl font-black md:text-3xl">{p.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{p.description}</p>
          <p className="mt-3 text-xs text-stone-500">{p.ratingPlaceholder} · Merchant: {p.merchant}</p>
          <p className="font-display mt-1 text-2xl font-black text-emerald-700">{p.pricePlaceholder}</p>
          <a href={p.affiliateUrl} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-emerald-950 hover:bg-amber-400">{p.cta} <ExternalLink className="h-4 w-4" /></a>
          <p className="mt-2 text-[11px] text-stone-500"><strong>Affiliate disclosure:</strong> {SITE.affiliateDisclosure}</p>
          <div className="mt-2"><ShareButtons title={p.name} path={`/products/${slug}`} /></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-bold">Benefits</h2>
          <ul className="mt-2 space-y-1.5 text-sm">{p.benefits.map((b, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{b}</li>)}</ul>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-bold">Limitations</h2>
          <ul className="mt-2 space-y-1.5 text-sm">{p.limitations.map((b, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />{b}</li>)}</ul>
        </section>
      </div>

      <p className="mt-4 text-sm">Related topics: {p.relatedTopics.map((t, i) => <span key={t}><Link href={t.includes("-") && !t.includes(" ") ? `/diseases/${t}` : `/search?q=${encodeURIComponent(t)}`} className="font-bold text-emerald-700 underline">{t}</Link>{i < p.relatedTopics.length - 1 ? " · " : ""}</span>)}</p>
      <div className="mt-4 space-y-4"><AdSlot slot="Product footer" /><DisclaimerBar /></div>
    </div>
  );
}
