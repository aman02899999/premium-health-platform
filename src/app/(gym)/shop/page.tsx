import Link from "next/link";
import { ArrowRight, BadgePercent, Crown, Flame, Pill, Zap } from "lucide-react";
import { getCatalog } from "@/lib/shop/server";
import { listPosts } from "@/lib/shop/store";
import { SITE_URL } from "@/lib/site";
import { ComboCard, ProductCard } from "@/components/shop/cards";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 60;

const ICONS = [Flame, Zap, BadgePercent, Pill];

export default async function ShopHome() {
  const { settings: s, categories, products, combos, offline } = await getCatalog();
  const posts = offline ? [] : await listPosts().catch(() => []);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const deals = [...products].sort((a, b) => b.discount - a.discount || b.listPrice - a.listPrice).slice(0, 8);
  const topCombos = combos.filter((c) => c.available).sort((a, b) => Number(b.featured) - Number(a.featured) || a.price - b.price).slice(0, 6);
  const maxOff = Math.max(0, ...categories.map((c) => c.discountPct));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: s.storeName,
          url: `${SITE_URL}/shop`,
          telephone: s.phone,
          address: s.address,
          description: s.seoDescription,
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/shop/products?q={query}`, "query-input": "required name=query" },
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
              <Crown className="h-3.5 w-3.5" /> {s.storeName}
            </p>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,9vw,4.5rem)] leading-[0.95] text-white">
              {s.heroTitle} <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">{s.heroHighlight}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{s.heroText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop/products" className="btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-bold">
                Shop the sale <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop/combos" className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 px-6 py-3.5 font-bold text-amber-200">
                See combo deals
              </Link>
            </div>
          </div>
          {maxOff > 0 && (
            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-[0_40px_120px_-30px_rgba(251,191,36,.7)]" />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-[2rem] bg-ink text-center">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">Mega sale</p>
                <p className="font-display text-[7rem] leading-none text-white">{maxOff}%</p>
                <p className="font-display text-3xl text-amber-300">OFF</p>
                <p className="mt-3 max-w-[14rem] text-sm text-white/60">On protein, pre-workout and aminos · plus extra off on combos</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Category discounts */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.slice(0, 8).map((c, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Link key={c.id} href={`/shop/c/${c.slug}`} className="group rounded-3xl border border-white/10 bg-white/[.03] p-4 transition hover:border-amber-300/40">
                  <Icon className="h-6 w-6 text-amber-300" />
                  <p className="mt-3 font-semibold text-white">{c.name}</p>
                  <p className="text-sm text-white/50">{c.discountPct > 0 ? <b className="text-amber-300">Up to {c.discountPct}% off</b> : "Shop now"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {offline && <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-white/60">The store is being updated. Please check back in a few minutes.</p>}

      {!offline && products.length === 0 && (
        <section className="mx-auto mt-14 max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl text-white">New stock arriving soon</h2>
          <p className="mt-2 text-white/60">
            We&apos;re adding our full range. Message us on{" "}
            <a href={`https://wa.me/${s.whatsapp}`} className="text-amber-300 underline">
              WhatsApp
            </a>{" "}
            for today&apos;s prices.
          </p>
        </section>
      )}

      {topCombos.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Bundle & save more</p>
              <h2 className="font-display text-3xl text-white sm:text-4xl">Combo deals</h2>
            </div>
            <Link href="/shop/combos" className="shrink-0 text-sm font-bold text-amber-300">
              All combos →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topCombos.map((c) => (
              <ComboCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {(featured.length > 0 ? featured : deals).length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-white sm:text-4xl">{featured.length > 0 ? "Coach's picks" : "Biggest discounts"}</h2>
            <Link href="/shop/products" className="shrink-0 text-sm font-bold text-amber-300">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {(featured.length > 0 ? featured : deals).map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 pb-6 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-white sm:text-4xl">Supplement guides</h2>
            <Link href="/shop/blog" className="shrink-0 text-sm font-bold text-amber-300">
              All guides →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/shop/blog/${p.slug}`} className="rounded-3xl border border-white/10 bg-white/[.03] p-5 transition hover:border-amber-300/40">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80">{p.tags[0] ?? "Guide"}</p>
                <h3 className="mt-2 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
