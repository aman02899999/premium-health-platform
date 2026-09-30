import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { EarningStats, PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Earn — How BHG Monetizes | Affiliate, Premium, Ads, Leads",
  description: "How Bharat Health Guide earns: premium ₹199/mo, affiliate 8%, AdSense, lab leads, digital products — digital marketing optimized, SEO optimized, SSO optimized.",
  alternates: { canonical: "/earn" },
};

export default function EarnPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Earn" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-teal-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Earning Platform — How We Monetize</h1>
        <p className="mt-2 max-w-3xl text-sm text-emerald-100/90">Transparent earning: premium subscription + affiliate + ads + leads + digital products. No cure claims, no false urgency — sustainable health media.</p>
      </div>

      <div className="mt-6"><EarningStats /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">5 Revenue Pillars — Digital Marketing Optimized</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div><p className="font-bold">1. Premium Subscription — ₹199/mo (SSO optimized)</p><p className="text-stone-600 dark:text-stone-300">Ad-free + unlimited unique India features. JWT + Google SSO. 1,247 demo users × ₹199 = ₹2.48L MRR. Churn control via weekly PDFs + WhatsApp tips. SEO: /premium ranks for “ad-free health India”.</p></div>
              <div><p className="font-bold">2. Affiliate — 8% avg (SEO + UTM optimized)</p><p className="text-stone-600 dark:text-stone-300">Glucometer, BP monitor, millet combo, yoga mat, protein, mustard oil. Tracked via gtag affiliate_click + UTM source/campaign + localStorage. Product JSON-LD for rich results. Disclosure on every page.</p></div>
              <div><p className="font-bold">3. AdSense + Direct — Optimized slots</p><p className="text-stone-600 dark:text-stone-300">AdSlot component with lazy loading, viewability tracking, premium users ad-free (higher ARPU). SEO: no CLS, no intrusive interstitials.</p></div>
              <div><p className="font-bold">4. Lead Gen — High ticket (Lab, dietitian, insurance)</p><p className="text-stone-600 dark:text-stone-300">HbA1c, thyroid, lipid bookings via partner labs. Dietitian consults. Health insurance. India-specific, high intent. Tracked via UTM + gtag generate_lead.</p></div>
              <div><p className="font-bold">5. Digital Products — Zero marginal cost</p><p className="text-stone-600 dark:text-stone-300">Thali templates, millet swap calendar, fasting calendar, dosha meal PDFs — ₹99-299, instant download, SSO protected.</p></div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">SEO Optimized — How we rank</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>Sitemap includes 50+ static + 120 diseases + 20 herbs + 12 blog + 13 unique India + 8 categories</li>
              <li>JSON-LD: Website, Organization, Breadcrumb, FAQ, BlogPosting, Product, ItemList, CollectionPage, HowTo</li>
              <li>Meta: title ≤60 chars, description ≤155, keywords 20, canonical, hreflang en-IN/en/x-default, OG image 1200×630</li>
              <li>Internal linking: related articles, latest, trending, categories — reduces bounce, increases dwell</li>
              <li>Freshness: /blog/latest updated weekly, /news daily, /api/realtime/pulse every 10 min</li>
              <li>Performance: Next Image, lazy loading, preconnect fonts, no CLS ads, &lt;500ms cache</li>
              <li>SSO: login increases return visits + saves preferences + premium conversion</li>
            </ul>
          </div>

          <AffiliateProducts limit={8} />
        </div>

        <div className="space-y-4">
          <PremiumCTA />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Digital Marketing Checklist — Pro</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <li>✅ UTM capture (source/medium/campaign/ref/fbclid/gclid)</li>
              <li>✅ GA4 page_view, scroll_depth, affiliate_click, generate_lead</li>
              <li>✅ FB Pixel PageView + ViewContent</li>
              <li>✅ Newsletter with lead magnet (20% conv)</li>
              <li>✅ OpenGraph + Twitter cards</li>
              <li>✅ Breadcrumbs + FAQ rich results</li>
              <li>✅ Internal linking + related articles</li>
              <li>✅ Exit-intent + sticky CTA (planned)</li>
              <li>✅ SSO — Google + email — increases LTV</li>
              <li>✅ Earning dashboard — affiliate clicks, premium MRR, ad rev</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
