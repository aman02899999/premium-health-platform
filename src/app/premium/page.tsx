import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { PremiumCTA, EarningStats } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { WhatsAppOptIn, PushPrompt } from "@/components/marketing/WhatsAppOptIn";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium — Ad-free + Personalized Thali + Meal Plans | Earning Platform",
  description: "Go premium ₹199/mo: ad-free, unlimited thali builder, millet swap, dosha meals, herb-drug checker, fasting planner, weekly PDF, WhatsApp tips — earning platform.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Premium" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-amber-900 p-8 text-white md:p-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300"><Crown className="h-4 w-4" /> Earning Platform — Premium</p>
        <h1 className="font-display mt-2 text-4xl font-black">Premium — Ad-free + Personalized Health</h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-100/90">Support independent health journalism. Get unlimited unique India features + weekly PDFs + WhatsApp tips. ₹199/mo — 30-day guarantee.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400"><Zap className="h-4 w-4" /> Start Premium — Demo</Link>
          <Link href="/deals" className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold hover:bg-white/10">View Deals</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">Compare Plans — Monthly vs Yearly vs Lifetime</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b text-stone-500"><th className="py-2">Feature</th><th>Free</th><th>Monthly ₹199</th><th>Yearly ₹1999 (-16%)</th><th>Lifetime ₹4999</th></tr></thead>
                <tbody className="text-sm">
                  <tr className="border-b"><td className="py-2">Thali builder</td><td>3/day</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
                  <tr className="border-b"><td className="py-2">Ad-free</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">PDF export</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">WhatsApp tips</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">Affiliate 10% off</td><td>—</td><td>—</td><td>✓</td><td>✓</td></tr>
                  <tr><td className="py-2">1:1 dietitian</td><td>—</td><td>—</td><td>—</td><td>✓ 1 session</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="/api/premium/checkout" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">Checkout API — /api/premium/checkout POST plan</a>
              <span className="text-xs text-stone-500">Mock Razorpay order + premium cookie, gtag purchase, UTM preserved.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">What you get — SEO & Earning optimized</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              {[
                "Unlimited thali builder + millet swap + dosha meals",
                "Herb-drug checker unlimited + fasting planner",
                "Yoga timer + Ritucharya seasonal + live advisory",
                "Ad-free reading across 290+ pages",
                "Priority health Q&A with citations",
                "Weekly meal PDF + WhatsApp tips (opt-in)",
                "Save thali plans + growth tracker history",
                "Early access to new unique India features",
              ].map((f) => (
                <p key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Why Premium is an Earning Platform</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-700 dark:text-stone-300">
              <li><strong>Subscription revenue:</strong> ₹199/mo × 1,247 users = ₹2.48L MRR (demo) — predictable, not ad-dependent</li>
              <li><strong>Affiliate revenue:</strong> 8% avg commission on glucometer, BP monitor, millet combo, yoga mat, protein — tracked via gtag + UTM</li>
              <li><strong>Ad revenue:</strong> AdSense + direct deals — premium users ad-free, free users monetized via optimized ad slots</li>
              <li><strong>Lead gen:</strong> Lab test bookings, dietitian consults, insurance — high-ticket, India-specific</li>
              <li><strong>Digital products:</strong> Meal plan PDFs, thali templates, fasting calendars — zero marginal cost</li>
            </ul>
          </div>

          <AffiliateProducts limit={6} title="Premium Members Also Buy — Affiliate Earning" />
        </div>

        <div className="space-y-4">
          <PremiumCTA />
          <EarningStats />
          <WhatsAppOptIn compact />
          <PushPrompt compact />
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="text-sm font-bold">Digital Marketing Optimized</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>UTM capture + session storage — knows if user came from Instagram, Google, YouTube</li>
              <li>GA4 page_view + scroll_depth + affiliate_click events</li>
              <li>FB Pixel PageView + ViewContent</li>
              <li>Newsletter with lead magnet — 20% conversion (demo)</li>
              <li>Exit-intent popup + sticky CTA (pro)</li>
              <li>OpenGraph + Twitter cards on every page</li>
              <li>Internal linking: related articles, trending, latest — reduces bounce</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
