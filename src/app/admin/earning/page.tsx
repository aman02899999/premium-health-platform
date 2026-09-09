import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { EarningStats } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Admin — Earning Dashboard | Premium MRR, Affiliate, Ads, Leads",
  description: "Admin earning dashboard: MRR, affiliate clicks, ad revenue, UTM sources, premium users — pro earning platform.",
  robots: { index: false, follow: false },
};

export default function AdminEarningPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/health" }, { label: "Earning Dashboard" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-amber-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Earning Dashboard — Admin (Pro)</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">MRR, affiliate, ads, leads, UTM — digital marketing optimized, SSO protected (admin role).</p>
      </div>

      <div className="mt-6"><EarningStats /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Revenue Breakdown — Last 30 Days (Demo)</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Premium MRR</span><span className="font-bold">₹2,48,153 (1247 users × ₹199)</span></div>
              <div className="flex justify-between"><span>Affiliate (8% avg, 342 clicks)</span><span className="font-bold">₹18,400</span></div>
              <div className="flex justify-between"><span>AdSense (120k views, ₹35 CPM)</span><span className="font-bold">₹42,300</span></div>
              <div className="flex justify-between"><span>Lead Gen (89 leads × ₹250 avg)</span><span className="font-bold">₹22,250</span></div>
              <div className="flex justify-between border-t pt-2 font-black"><span>Total</span><span>₹3,31,103</span></div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">UTM Sources — Top (Digital Marketing)</h2>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span>instagram / bio / summer-heat</span><span className="font-bold">342 users, 12% conv</span></div>
              <div className="flex justify-between"><span>google / organic / diabetes-guide</span><span className="font-bold">521 users, 8% conv</span></div>
              <div className="flex justify-between"><span>youtube / video / thali-builder</span><span className="font-bold">198 users, 15% conv</span></div>
              <div className="flex justify-between"><span>referral / user / viral-loop</span><span className="font-bold">89 users, 22% conv (best)</span></div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Affiliate Clicks — Recent (Demo, localStorage + /api/affiliate/click)</h2>
            <p className="mt-1 text-xs text-stone-500">Tracked via gtag + localStorage bhg-aff-clicks + POST /api/affiliate/click — product, merchant, UTM, timestamp.</p>
            <div className="mt-3 rounded-xl bg-stone-50 p-3 text-[11px] font-mono dark:bg-stone-800">Check browser localStorage: bhg-aff-clicks, bhg-utm, bhg-pageviews + /api/affiliate/click?limit=20</div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">New Earning APIs — Pro</h2>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>/api/affiliate/click POST productId</span><span className="font-bold">8% avg, Rs160/sale</span></div>
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
            <h2 className="text-sm font-bold">Unique Pages SEO — 19/19 Enhanced</h2>
            <p className="mt-1 text-xs text-stone-500">All unique India pages now have seoTitle≤60, desc≤155, canonical+hreflang, OG /api/og, FAQ (2) + HowTo 4 steps + Breadcrumb JSON-LD, PremiumCTA+Affiliate+Latest sidebar.</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
              <span>✓ thali-builder</span><span>✓ millet-swap</span><span>✓ india-risk</span><span>✓ yoga-timer</span><span>✓ ritucharya</span><span>✓ herb-interaction</span><span>✓ barcode-scanner</span><span>✓ child-growth</span><span>✓ health-qa</span><span>✓ live-advisory</span><span>✓ dosha-meals</span><span>✓ fasting-planner</span><span>✓ hinglish-search</span><span>✓ nutrition-tracker</span><span>✓ workout-builder</span><span>✓ food-database</span><span>✓ health-search</span><span>✓ drug-lookup</span><span>✓ exercises</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AffiliateProducts limit={4} />
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-sm font-bold">Admin Actions — Pro</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="/admin/health" className="font-bold text-emerald-700 underline">Health Providers Dashboard →</a></li>
              <li><a href="/api/health/providers?health=true" className="font-bold text-emerald-700 underline">Provider Health Check →</a></li>
              <li><a href="/api/health/sync" className="font-bold text-emerald-700 underline">Sync Jobs →</a></li>
              <li><a href="/api/health/status" className="font-bold text-emerald-700 underline">System Status →</a></li>
              <li><a href="/api/affiliate/click?limit=20" className="font-bold text-emerald-700 underline">Affiliate Clicks API →</a></li>
              <li><a href="/api/newsletter?limit=20" className="font-bold text-emerald-700 underline">Newsletter Subs →</a></li>
              <li><a href="/api/lead?limit=20" className="font-bold text-emerald-700 underline">Leads API →</a></li>
              <li><a href="/api/referral?limit=20" className="font-bold text-emerald-700 underline">Referrals API →</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
