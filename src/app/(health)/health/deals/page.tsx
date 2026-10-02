import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { getActiveCoupons } from "@/health/lib/monetization/config";
import { CouponCard } from "@/health/components/monetization/ProductCards";
import { AdBanner } from "@/health/components/monetization/AdComponents";

const seoTitle = "Health Product Picks — Glucometer, BP Monitor & More | Premium Health";
const seoDescription = "Hand-picked health products on Amazon India — glucometers, BP monitors, scales and everyday nutrition. Live prices; clearly marked affiliate links.";
const url = "/health/deals";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Deals & Coupons — Health")}&category=${encodeURIComponent("Affiliate Earning")}&type=Product`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function DealsPage() {
  const activeCoupons = getActiveCoupons();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Product picks" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Deals", item: "/health/deals" }]}
        faqs={[
          { q: "Do you earn from these links?", a: "Yes. These are Amazon affiliate links: if you buy, Amazon pays us a small commission at no extra cost to you. Commission never decides what we recommend." },
          { q: "Why don't you show prices?", a: "Amazon prices change often. Each link opens the product on Amazon so you always see the current price." },
        ]}
        howTo={{ name: "How to choose a health device", steps: ["Pick the category you need — blood sugar, blood pressure or weight", "Open the product on Amazon to check the current price and reviews", "Prefer validated devices and ask your doctor which readings to track"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Hand-picked on Amazon</p>
        <h1 className="font-display mt-1 text-3xl font-black">Health Product Picks</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Products we&apos;d actually recommend for monitoring and everyday health. Prices are live on Amazon — we may earn a small commission at no extra cost to you, and it never changes what we recommend.</p>
      </div>

      <div className="mt-4"><AdBanner placement="products_sidebar" page="/health/deals" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {activeCoupons.length > 0 && (
            <div>
              <h2 className="font-bold">Coupons</h2>
              <div className="mt-3 grid gap-4">
                {activeCoupons.map((c) => <CouponCard key={c.id} coupon={c} page="/health/deals" />)}
              </div>
            </div>
          )}

          <AffiliateProducts limit={12} title="Our picks" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Deals footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
