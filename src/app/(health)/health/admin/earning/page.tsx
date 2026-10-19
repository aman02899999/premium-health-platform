import type { Metadata } from "next";
import { requireAdmin } from "@/health/lib/auth/server";
import { Breadcrumbs } from "@/health/components/ui";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { RevenueDashboard } from "@/health/components/earning/RevenueDashboard";
import { isDbConfigured } from "@/health/db";
import { todayIST } from "@/lib/growth/dates";
import { healthAudience, parsePeriod, revenueReport } from "@/lib/revenue/report";
import { AdminMonetizationManager } from "@/health/components/monetization/AdminManager";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";

const seoTitle = "Admin — Earnings";
const seoDescription = "Admin only: money collected, refunds, net revenue, leads and conversion by channel and campaign, from the site's own records.";
const url = "/health/admin/earning";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Admin Earning Dashboard Charts")}&category=${encodeURIComponent("Admin Pro")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  robots: { index: false, follow: false },
};

export default async function AdminEarningPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/health/admin/earning");
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null);
  const period = parsePeriod(one(q.from), one(q.to), todayIST());
  const [report, audience] = isDbConfigured ? await Promise.all([revenueReport(period).catch(() => null), healthAudience().catch(() => null)]) : [null, null];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Admin", href: "/health/admin/health" }, { label: "Earnings" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Admin", item: "/health/admin/health" }, { name: "Earning Dashboard", item: "/health/admin/earning" }]}
        faqs={[
          { q: "What does the earning dashboard track?", a: "Money actually collected through the site (memberships, diet plans, supplement store, book library), refunds, net revenue, leads, lead-to-customer conversion and the campaigns that brought them, all computed from the order and lead records. Figures without data behind them, such as ad spend and profit, are marked as not available." },
          { q: "Why do some leads and orders show as Unknown?", a: "Where someone came from is recorded only since attribution tracking was added, and only when their browser kept the site's attribution cookie. Older records, and visitors who blocked cookies, show as Unknown rather than being guessed." },
        ]}
        howTo={{ name: "How to use earning dashboard", steps: ["Pick a date range (India time)", "Read collected, refunded and net money by product", "Compare channels and campaigns by leads, paid orders and net revenue", "Tag every link you share with utm_source, utm_medium and utm_campaign so it shows up here"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-amber-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Admin</p>
        <h1 className="font-display mt-1 text-3xl font-black">Earnings</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Money collected through the site, refunds, and which channels and campaigns brought leads and buyers. Revenue, not profit: costs aren&apos;t recorded.</p>
      </div>

      <div className="mt-6">
        {report ? <RevenueDashboard report={report} audience={audience} /> : <p className="rounded-2xl bg-amber-50 p-4 text-sm dark:bg-amber-950">Couldn&apos;t load the figures from the database. Nothing is shown rather than a guess.</p>}
      </div>

      <div className="mt-6"><AdminMonetizationManager /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Affiliate clicks</h2>
            <p className="mt-1 text-xs text-stone-500">Tracked via gtag + localStorage bhg-aff-clicks + POST /api/affiliate/click — product, merchant, UTM, timestamp. Related API /api/blog/related?slug=xxx boosts internal linking dwell time + affiliate CTR.</p>
            <div className="mt-3 rounded-xl bg-stone-50 p-3 text-[11px] font-mono dark:bg-stone-800">Check localStorage: bhg-aff-clicks, bhg-utm, bhg-pageviews + APIs: /api/affiliate/click?limit=20 + /api/blog/related?slug=complete-indian-guide-type-2-diabetes + /api/blog/trending + /api/blog/latest</div>
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
              <li><a href="/health/admin/health" className="font-bold text-emerald-700 underline">Health Providers Dashboard →</a></li>
              <li><a href="/health/api/health/providers?health=true" className="font-bold text-emerald-700 underline">Provider Health Check →</a></li>
              <li><a href="/health/api/health/sync" className="font-bold text-emerald-700 underline">Sync Jobs →</a></li>
              <li><a href="/health/api/health/status" className="font-bold text-emerald-700 underline">System Status →</a></li>
              <li><a href="/health/api/affiliate/click?limit=20" className="font-bold text-emerald-700 underline">Affiliate Clicks API →</a></li>
              <li><a href="/health/api/blog/related?slug=complete-indian-guide-type-2-diabetes&limit=4" className="font-bold text-emerald-700 underline">Blog Related API →</a></li>
              <li><a href="/health/api/blog/trending?limit=6" className="font-bold text-emerald-700 underline">Blog Trending API →</a></li>
              <li><a href="/health/api/blog/latest?limit=8" className="font-bold text-emerald-700 underline">Blog Latest API →</a></li>
              <li><a href="/health/api/newsletter?limit=20" className="font-bold text-emerald-700 underline">Newsletter Subs →</a></li>
              <li><a href="/health/api/lead?limit=20" className="font-bold text-emerald-700 underline">Leads API →</a></li>
              <li><a href="/health/api/referral?limit=20" className="font-bold text-emerald-700 underline">Referrals API →</a></li>
              <li><a href="/health/sitemap.xml" className="font-bold text-emerald-700 underline">Sitemap.xml →</a></li>
              <li><a href="/robots.txt" className="font-bold text-emerald-700 underline">Robots.txt →</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
