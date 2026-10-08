import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCatalog } from "@/lib/shop/server";
import { parseMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";
import { Markdown } from "@/components/blog/Markdown";
import { ComboCard, ProductCard } from "@/components/shop/cards";
import { ProductBuyBox, ProductGallery } from "@/components/shop/ProductBuyBox";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 60;
export const generateStaticParams = () => [];

const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const off = p.discount > 0 ? ` — ${p.discount}% OFF` : "";
  const title = p.seoTitle || `${p.name}${p.size ? ` ${p.size}` : ""}${off}`;
  const description = (p.seoDescription || `Buy ${p.name} online at ₹${p.salePrice.toLocaleString("en-IN")}${p.discount ? ` (${p.discount}% off ₹${p.listPrice.toLocaleString("en-IN")})` : ""}. ${p.shortDescription}`).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/shop/p/${p.slug}` },
    openGraph: { type: "website", title, description, url: `${SITE_URL}/shop/p/${p.slug}`, images: p.images.slice(0, 1).map((u) => ({ url: abs(u), alt: p.name })) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, combos, settings } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const related = products.filter((x) => x.id !== p.id && x.categoryId === p.categoryId).slice(0, 4);
  const inCombos = combos.filter((c) => c.available && c.lines.some((l) => l.product.id === p.id)).slice(0, 3);
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            image: p.images.map(abs),
            description: p.shortDescription || p.description.slice(0, 300),
            sku: p.sku || p.id,
            ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
            category: p.category?.name,
            offers: {
              "@type": "Offer",
              url: `${SITE_URL}/shop/p/${p.slug}`,
              priceCurrency: "INR",
              price: p.salePrice,
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: settings.storeName },
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/shop` },
              ...(p.category ? [{ "@type": "ListItem", position: 2, name: p.category.name, item: `${SITE_URL}/shop/c/${p.category.slug}` }] : []),
              { "@type": "ListItem", position: p.category ? 3 : 2, name: p.name, item: `${SITE_URL}/shop/p/${p.slug}` },
            ],
          },
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-4 text-xs text-white/50" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-amber-300">
            Shop
          </Link>
          {p.category && (
            <>
              {" / "}
              <Link href={`/shop/c/${p.category.slug}`} className="hover:text-amber-300">
                {p.category.name}
              </Link>
            </>
          )}
        </nav>
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery images={p.images} name={p.name} discount={p.discount} />
          <div>
            {p.brand && <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{p.brand}</p>}
            <h1 className="font-display mt-1 text-3xl leading-tight text-white sm:text-4xl">{p.name}</h1>
            {p.size && <p className="mt-1 text-white/55">{p.size}</p>}
            {p.shortDescription && <p className="mt-3 text-white/75">{p.shortDescription}</p>}
            <div className="mt-5">
              <ProductBuyBox id={p.id} name={p.name} images={p.images} flavours={p.flavours} stock={p.stock} sale={p.salePrice} list={p.listPrice} discount={p.discount} />
            </div>
            {p.highlights.length > 0 && (
              <ul className="mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {p.description && (
              <>
                <h2 className="font-display mb-3 text-2xl text-white">About this product</h2>
                <Markdown blocks={parseMarkdown(p.description)} cta={{ whatsapp: settings.whatsapp, phone: settings.phone }} />
              </>
            )}
            {p.howToUse && (
              <>
                <h2 className="font-display mb-2 mt-8 text-2xl text-white">How to use</h2>
                <p className="whitespace-pre-line text-white/75">{p.howToUse}</p>
              </>
            )}
            {p.warnings && (
              <div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-100">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
                <p className="whitespace-pre-line">{p.warnings}</p>
              </div>
            )}
          </div>
          {p.nutrition.length > 0 && (
            <aside>
              <h2 className="font-display mb-3 text-2xl text-white">Nutrition per serving</h2>
              <table className="w-full overflow-hidden rounded-2xl text-sm ring-1 ring-white/10">
                <tbody>
                  {p.nutrition.map((n) => (
                    <tr key={n.label} className="border-b border-white/5 last:border-0">
                      <th className="bg-white/[.03] px-4 py-2.5 text-left font-medium text-white/70">{n.label}</th>
                      <td className="px-4 py-2.5 text-right font-semibold text-white">{n.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </aside>
          )}
        </div>

        {inCombos.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display mb-5 text-3xl text-white">Save more in a combo</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {inCombos.map((c) => (
                <ComboCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        )}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display mb-5 text-3xl text-white">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
