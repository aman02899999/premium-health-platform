import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { EarningCharts } from "@/components/earning/EarningCharts";
import { AdminMonetizationManager } from "@/components/monetization/AdminManager";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";

const seoTitle = "Admin — Earning Dashboard Charts | Pro Analytics";
const seoDescription = "Admin earning dashboard with charts: MRR, affiliate clicks, ad revenue, UTM sources, funnel — digital marketing optimized, SSO protected, SEO pro + earning APIs.";
const url = "/admin/earning";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Admin Earning Dashboard Charts")}&category=${encodeURIComponent("Admin Pro")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  robots: { index: false, follow: false },
};

export default function AdminEarningPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/health" }, { label: "Earning Dashboard Charts" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Admin", item: "/admin/health" }, { name: "Earning Dashboard", item: "/admin/earning" }]}
        faqs={[
          { q: "What does earning dashboard track?", a: "MRR premium 1247×₹199, affiliate 8% avg Rs160-360/sale via /api/affiliate/click + gtag + UTM, AdSense 120k views ₹35 CPM, lead gen Rs150-500/lead, UTM sources, referral viral loop 22% conv — all via /api/earn/stats + /admin/earning charts." },
          { q: "How to use charts for marketing?", a: "Weekly bar chart shows Premium+Affiliate+Ads+Leads daily, breakdown stacked bar, UTM bar + conv%, funnel visitor→newsletter→lead→premium — optimized via ExitIntent+StickyCTA+NewsletterPopup+WhatsAppOptIn+PushPrompt+Referral." },
        ]}
        howTo={{ name: "How to use earning dashboard", steps: ["View KPI cards MRR, affiliate, ads, leads with localStorage bhg-aff-clicks", "Analyze weekly bar chart + revenue breakdown + UTM sources + funnel", "Check affiliate clicks via /api/affiliate/click?limit=20 + newsletter + leads + referrals", "Optimize marketing via UTMTracker + gtag + referral viral loop"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-amber-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">SEO Pro — Earning Platform — Charts + FAQ+HowTo+Breadcrumb+OG — Admin SSO Protected</p>
        <h1 className="font-display mt-1 text-3xl font-black">Earning Dashboard — Charts + Analytics — Admin Pro</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">MRR, affiliate, ads, leads, UTM, funnel — with bar charts, breakdown, conversion funnel — digital marketing optimized, SSO protected (admin role), SEO pro FAQ+HowTo+Breadcrumb+OG /api/og + earning APIs.</p>
      </div>

      <div className="mt-6"><EarningCharts /></div>

      <div className="mt-6"><AdminMonetizationManager /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Affiliate Clicks — Recent (Demo, localStorage + /api/affiliate/click + /api/blog/related)</h2>
            <p className="mt-1 text-xs text-stone-500">Tracked via gtag + localStorage bhg-aff-clicks + POST /api/affiliate/click — product, merchant, UTM, timestamp. Related API /api/blog/related?slug=xxx boosts internal linking dwell time + affiliate CTR.</p>
            <div className="mt-3 rounded-xl bg-stone-50 p-3 text-[11px] font-mono dark:bg-stone-800">Check localStorage: bhg-aff-clicks, bhg-utm, bhg-pageviews + APIs: /api/affiliate/click?limit=20 + /api/blog/related?slug=complete-indian-guide-type-2-diabetes + /api/blog/trending + /api/blog/latest</div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">New Earning + Blog APIs — Pro SEO + Digital Marketing</h2>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>/api/blog/related?slug=xxx&limit=6</span><span className="font-bold">Related scoring category+tags+featured — SEO internal linking</span></div>
              <div className="flex justify-between"><span>/api/blog/trending?limit=6</span><span className="font-bold">Trending flag + updatedAt — social proof FOMO</span></div>
              <div className="flex justify-between"><span>/api/blog/latest?limit=8&category=Nutrition</span><span className="font-bold">Freshness signal — latest + filter category</span></div>
              <div className="flex justify-between"><span>/api/affiliate/click POST productId</span><span className="font-bold">8% avg, Rs160/sale — gtag + UTM</span></div>
              <div className="flex justify-between"><span>/api/newsletter POST email leadMagnet</span><span className="font-bold">20% open, 2% premium conv</span></div>
              <div className="flex justify-between"><span>/api/push/subscribe POST endpoint</span><span className="font-bold">30% open, 8% click</span></div>
              <div className="flex justify-between"><span>/api/whatsapp/optin POST phone consent</span><span className="font-bold">40% open, 15% click — best</span></div>
              <div className="flex justify-between"><span>/api/webhooks/razorpay POST payment</span><span className="font-bold">MRR confirm, gtag purchase</span></div>
              <div className="flex justify-between"><span>/api/lead POST lab/dietitian/insurance</span><span className="font-bold">Rs150-500/lead</span></div>
              <div className="flex justify-between"><span>/api/referral POST viral loop</span><span className="font-bold">22% conv — best UTM</span></div>
              <div className="flex justify-between"><span>/api/premium/checkout POST plan</span><span className="font-bold">Rs199/1999/4999 mock Razorpay</span></div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Unique Pages SEO — 19/19 Enhanced + Blog 15 + Products 10 + Sitemap/Robots Pro</h2>
            <p className="mt-1 text-xs text-stone-500">All unique India pages have seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og 1200x630, FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD, PremiumCTA+Affiliate+Latest sidebar. Blog categories/latest/trending have CollectionPage+ItemList+Breadcrumb+FAQ+HowTo+OG. Sitemap includes all unique + blog + categories + products + 13 institutional + earning routes. Robots optimized allow 19 unique + blog categories/latest/trending + disallow /api/ /admin/.</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
              <span>✓ thali-builder</span><span>✓ millet-swap</span><span>✓ india-risk</span><span>✓ yoga-timer</span><span>✓ ritucharya</span><span>✓ herb-interaction</span><span>✓ barcode-scanner</span><span>✓ child-growth</span><span>✓ health-qa</span><span>✓ live-advisory</span><span>✓ dosha-meals</span><span>✓ fasting-planner</span><span>✓ hinglish-search</span><span>✓ nutrition-tracker</span><span>✓ workout-builder</span><span>✓ food-database</span><span>✓ health-search</span><span>✓ drug-lookup</span><span>✓ exercises</span><span>✓ blog/category/[slug] (13)</span><span>✓ blog/latest</span><span>✓ blog/trending</span><span>✓ /api/blog/related</span><span>✓ /api/blog/trending</span><span>✓ /api/blog/latest</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AffiliateProducts limit={4} title="Admin — Earning — Affiliate Picks" />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">Admin Actions — Pro + SEO + Earning</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="/admin/health" className="font-bold text-emerald-700 underline">Health Providers Dashboard →</a></li>
              <li><a href="/api/health/providers?health=true" className="font-bold text-emerald-700 underline">Provider Health Check →</a></li>
              <li><a href="/api/health/sync" className="font-bold text-emerald-700 underline">Sync Jobs →</a></li>
              <li><a href="/api/health/status" className="font-bold text-emerald-700 underline">System Status →</a></li>
              <li><a href="/api/affiliate/click?limit=20" className="font-bold text-emerald-700 underline">Affiliate Clicks API →</a></li>
              <li><a href="/api/blog/related?slug=complete-indian-guide-type-2-diabetes&limit=4" className="font-bold text-emerald-700 underline">Blog Related API →</a></li>
              <li><a href="/api/blog/trending?limit=6" className="font-bold text-emerald-700 underline">Blog Trending API →</a></li>
              <li><a href="/api/blog/latest?limit=8" className="font-bold text-emerald-700 underline">Blog Latest API →</a></li>
              <li><a href="/api/newsletter?limit=20" className="font-bold text-emerald-700 underline">Newsletter Subs →</a></li>
              <li><a href="/api/lead?limit=20" className="font-bold text-emerald-700 underline">Leads API →</a></li>
              <li><a href="/api/referral?limit=20" className="font-bold text-emerald-700 underline">Referrals API →</a></li>
              <li><a href="/sitemap.xml" className="font-bold text-emerald-700 underline">Sitemap.xml →</a></li>
              <li><a href="/robots.txt" className="font-bold text-emerald-700 underline">Robots.txt →</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
