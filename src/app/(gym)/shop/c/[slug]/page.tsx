import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getCatalog } from "@/lib/shop/server";
import { SITE_URL } from "@/lib/site";
import { ProductBrowser } from "@/components/shop/ProductBrowser";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 60;
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const c = categories.find((x) => x.slug === slug);
  if (!c) return { title: "Category not found", robots: { index: false } };
  const off = c.discountPct > 0 ? ` — ${c.discountPct}% off` : "";
  return {
    title: c.seoTitle || `${c.name}${off}`,
    description: c.seoDescription || `${c.description} Genuine products at sale prices with secure checkout.`.slice(0, 160),
    alternates: { canonical: `/shop/c/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { categories, products } = await getCatalog();
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const items = products.filter((p) => p.category?.slug === c.slug);
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/shop` },
            { "@type": "ListItem", position: 2, name: c.name, item: `${SITE_URL}/shop/c/${c.slug}` },
          ],
        }}
      />
      <nav className="mb-3 text-xs text-white/50" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-amber-300">
          Shop
        </Link>{" "}
        / {c.name}
      </nav>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <h1 className="font-display text-4xl text-white">{c.name}</h1>
        {c.discountPct > 0 && <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-black">{c.discountPct}% OFF</span>}
      </div>
      {c.description && <p className="-mt-3 mb-6 max-w-2xl text-white/60">{c.description}</p>}
      <Suspense>
        <ProductBrowser products={items} categories={categories} fixedCategory={c.slug} />
      </Suspense>
    </section>
  );
}
