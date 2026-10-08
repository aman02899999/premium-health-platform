import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/shop/server";
import { SITE_URL } from "@/lib/site";
import { AddToCart, OffBadge, Price, ProductImage } from "@/components/shop/ui";
import { inr } from "@/lib/shop/format";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 60;
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { combos } = await getCatalog();
  const c = combos.find((x) => x.slug === slug);
  if (!c) return { title: "Combo not found", robots: { index: false } };
  return {
    title: `${c.name} — ₹${c.price.toLocaleString("en-IN")}`,
    description: `${c.lines.map((l) => l.product.name).join(" + ")} for ₹${c.price.toLocaleString("en-IN")} (worth ₹${c.listTotal.toLocaleString("en-IN")}).`.slice(0, 160),
    alternates: { canonical: `/shop/combos/${c.slug}` },
  };
}

export default async function ComboPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { combos, settings } = await getCatalog();
  const c = combos.find((x) => x.slug === slug);
  if (!c) notFound();
  const pct = c.listTotal > 0 ? Math.round(((c.listTotal - c.price) / c.listTotal) * 100) : 0;
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: c.name,
          description: c.description || c.lines.map((l) => l.product.name).join(" + "),
          image: c.lines.flatMap((l) => l.product.images.slice(0, 1)).map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u}`)),
          offers: { "@type": "Offer", priceCurrency: "INR", price: c.price, availability: c.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_URL}/shop/combos/${c.slug}`, seller: { "@type": "Organization", name: settings.storeName } },
        }}
      />
      <nav className="mb-4 text-xs text-white/50" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-amber-300">
          Shop
        </Link>{" "}
        /{" "}
        <Link href="/shop/combos" className="hover:text-amber-300">
          Combos
        </Link>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Combo · extra {c.extraPct}% off</p>
          <h1 className="font-display text-4xl text-white sm:text-5xl">{c.name}</h1>
          {c.description && <p className="mt-2 max-w-2xl text-white/65">{c.description}</p>}
        </div>
        <OffBadge pct={pct} className="scale-125" />
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {c.lines.map((l) => (
          <li key={l.product.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <Link href={`/shop/p/${l.product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
              <ProductImage src={l.product.images[0]} alt={l.product.name} sizes="80px" className="p-1" />
            </Link>
            <div className="min-w-0">
              <Link href={`/shop/p/${l.product.slug}`} className="font-semibold text-white hover:text-amber-200">
                {l.qty > 1 ? `${l.qty} × ` : ""}
                {l.product.name}
              </Link>
              <p className="text-sm text-white/50">
                <span className="line-through">{inr(l.product.listPrice * l.qty)}</span> → {inr(l.product.salePrice * l.qty)}
              </p>
              {l.product.stock < l.qty && <p className="text-xs text-red-300">Out of stock</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-amber-300/30 bg-amber-300/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Price sale={c.price} list={c.listTotal} size="lg" />
          <p className="mt-1 text-xs text-white/50">
            Items at sale prices: {inr(c.saleTotal)} · combo discount: −{inr(c.saleTotal - c.price)}
          </p>
        </div>
        <AddToCart line={{ kind: "combo", id: c.id, qty: 1 }} name={c.name} disabled={!c.available} label="Add combo to cart" className="sm:min-w-56" />
      </div>
    </section>
  );
}
