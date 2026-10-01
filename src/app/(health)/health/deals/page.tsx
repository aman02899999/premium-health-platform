import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { LatestArticles } from "@/health/components/blog/LatestArticles";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { COUPONS, getActiveCoupons, getExpiredCoupons } from "@/health/lib/monetization/config";
import { CouponCard } from "@/health/components/monetization/ProductCards";
import { AdBanner } from "@/health/components/monetization/AdComponents";

const seoTitle = "Deals & Coupons — Health Products Affiliate | Premium Health";
const seoDescription = "Best deals + coupons: glucometer, BP monitor, millets, yoga mat, protein — coupon code, discount, affiliate URL, expiration, merchant, tracking, auto-expire.";
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
  const expiredCoupons = getExpiredCoupons();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Deals & Coupons" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Deals", item: "/health/deals" }]}
        faqs={[
          { q: "How does affiliate earning work?", a: "When you buy via our link, merchant pays 8% avg commission — e.g., glucometer Rs1999 * 8% = Rs160. No extra cost to you. Tracked via gtag affiliate_click + UTM + /api/affiliate/click + /api/monetization/analytics coupon_clicked." },
          { q: "How coupon system works?", a: "Coupon/deal system with fields: coupon code, discount, affiliate URL, expiration date, merchant, category, tracking ID. Automatically marks expired as inactive via getActiveCoupons() filtering expirationDate. Never display expired as active. Affiliate disclosure where applicable." },
        ]}
        howTo={{ name: "How to get best health deals & coupons", steps: ["Browse deals by category: diabetes, BP, millet, yoga, protein + coupons with code + discount + expiry", "Click affiliate link — tracked via UTM + gtag + /api/affiliate/click + coupon_clicked", "Buy on merchant site — 8% avg commission supports independent health journalism", "Save favorites in premium, get price drop alerts via newsletter + push + WhatsApp"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Affiliate + Coupons</p>
        <h1 className="font-display mt-1 text-3xl font-black">Deals & Coupons — Health Products</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Handpicked health products + coupons: glucometer, BP monitor, millet combo, yoga mat, protein — coupon code, discount, affiliate URL, expiration, merchant, category, tracking ID. Auto-mark expired inactive. Affiliate disclosure.</p>
      </div>

      <div className="mt-4"><AdBanner placement="products_sidebar" page="/health/deals" /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-bold">Active Coupons — {activeCoupons.length} — Auto-Expire Handling</h2>
            <p className="mt-1 text-xs text-stone-500">Coupon fields: code, discount, affiliateUrl, expirationDate, merchant, category, trackingId, terms. Auto-mark expired inactive — never display expired as active. Affiliate disclosure.</p>
            <div className="mt-3 grid gap-4">
              {activeCoupons.map((c) => <CouponCard key={c.id} coupon={c} page="/health/deals" />)}
            </div>
          </div>

          {expiredCoupons.length > 0 && (
            <div>
              <h2 className="font-bold">Expired — Auto-Hidden Demo — {expiredCoupons.length}</h2>
              <p className="mt-1 text-xs text-stone-500">These are automatically marked inactive via getActiveCoupons() — never display as active. Demo shows expired handling.</p>
              <div className="mt-3 grid gap-4 opacity-60">
                {expiredCoupons.map((c) => <CouponCard key={c.id} coupon={c} page="/health/deals" />)}
              </div>
            </div>
          )}

          <AffiliateProducts limit={8} title="Top Deals" />
          <LatestArticles limit={4} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">How to Create Coupon</h3>
            <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Add to COUPONS in src/lib/monetization/config.ts — id, slug, title, code, discount, merchant, affiliateUrl, expirationDate ISO, category, ctaText, terms, active, featured, priority</li>
              <li>Set expirationDate — auto-mark inactive after expiry via getActiveCoupons()</li>
              <li>Render via CouponCard — tracks coupon_clicked via analytics</li>
              <li>Test: /api/monetization/coupons + /api/monetization/coupons?includeExpired=true + /deals page</li>
              <li>Affiliate disclosure required — add disclosure field</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Deals footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
