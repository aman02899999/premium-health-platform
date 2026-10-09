import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Crown, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { getCatalog } from "@/lib/shop/server";
import { SITE_URL } from "@/lib/site";
import { fssaiLabel } from "@/lib/shop/format";
import { CartProvider } from "@/components/shop/cart";
import { ShopBottomNav, ShopHeader } from "@/components/shop/chrome";
import { CartToast } from "@/components/shop/ui";

// Rendered per request from the tagged data cache (see lib/shop/server.ts): prices and stock are
// never a build or ISR snapshot, and admin changes show on the very next page view.
export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getCatalog();
  return {
    title: { default: s.seoTitle, template: `%s | ${s.storeName}` },
    description: s.seoDescription,
    alternates: { canonical: `${SITE_URL}/shop` },
    openGraph: {
      type: "website",
      siteName: s.storeName,
      title: s.seoTitle,
      description: s.seoDescription,
      url: `${SITE_URL}/shop`,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: s.seoTitle,
      description: s.seoDescription,
    },
  };
}

export default async function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { settings: s, categories } = await getCatalog();
  return (
    <CartProvider>
      <div className="shop-theme">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <ShopHeader
          storeName={s.storeName}
          announcement={s.announcement}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <section className="border-t border-white/10 bg-coal/60">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-white/70 sm:grid-cols-3 sm:px-6">
            <p className="flex items-center gap-3">
              <BadgeCheck className="h-6 w-6 shrink-0 text-amber-300" /> Genuine
              products from authorised supply, with invoice
            </p>
            <p className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-amber-300" /> Secure
              payment by Razorpay — UPI, cards, net banking
            </p>
            <p className="flex items-center gap-3">
              <Truck className="h-6 w-6 shrink-0 text-amber-300" />{" "}
              {s.dispatchText}
            </p>
          </div>
        </section>
        <footer className="border-t border-white/10 bg-ink">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-white/60 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            <div>
              <p className="font-display flex items-center gap-2 text-xl text-white">
                <Crown className="h-5 w-5 text-amber-300" /> {s.storeName}
              </p>
              <p className="mt-2">{s.tagline}</p>
            </div>
            <div>
              <h2 className="font-display mb-3 text-base text-white">Shop</h2>
              <ul className="space-y-0.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop/c/${c.slug}`}
                      className="inline-block py-1 hover:text-amber-300"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/shop/combos"
                    className="inline-block py-1 hover:text-amber-300"
                  >
                    Combo offers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-display mb-3 text-base text-white">Help</h2>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/shop/account"
                    className="inline-block py-1 hover:text-amber-300"
                  >
                    Track my order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop/policies"
                    className="inline-block py-1 hover:text-amber-300"
                  >
                    Shipping, returns & contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop/blog"
                    className="inline-block py-1 hover:text-amber-300"
                  >
                    Supplement guides
                  </Link>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${s.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 hover:text-amber-300"
                  >
                    WhatsApp {s.phone}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-display mb-3 text-base text-white">
                Seller details
              </h2>
              {s.sellerName && <p className="text-white/80">Sold by {s.sellerName}</p>}
              <p>{s.address}</p>
              {s.fssaiLicence && (
                <p className="mt-2">
                  {fssaiLabel(s.fssaiType)} {s.fssaiLicence}
                </p>
              )}
              {s.gstin && <p>GSTIN {s.gstin}</p>}
            </div>
          </div>
          <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
            © {new Date().getFullYear()} {s.storeName}. Food supplements are not
            medicines and are not meant to diagnose, treat or prevent any
            disease. ·{" "}
            <Link href="/" className="underline">
              Royal Fitness Club
            </Link>
          </p>
        </footer>
        <ShopBottomNav />
        <CartToast />
      </div>
    </CartProvider>
  );
}
