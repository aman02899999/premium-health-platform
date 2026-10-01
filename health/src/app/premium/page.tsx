import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";
import { WhatsAppOptIn, PushPrompt } from "@/components/marketing/WhatsAppOptIn";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium — Ad-free + Personalized Thali + Meal Plans",
  description: "Go premium ₹199/mo: ad-free, unlimited thali builder, millet swap, dosha meals, herb-drug checker, fasting planner, weekly PDF, WhatsApp tips.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Premium" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-amber-900 p-8 text-white md:p-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300"><Crown className="h-4 w-4" /> Premium</p>
        <h1 className="font-display mt-2 text-4xl font-black">Premium — Ad-free + Personalized Health</h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-100/90">Support independent health journalism. Get unlimited unique India features + weekly PDFs + WhatsApp tips. ₹199/mo — 30-day guarantee.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://wa.me/918851830081?text=Hi%2C%20I%20want%20to%20join%20Premium%20Health%20Platform" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400"><Zap className="h-4 w-4" /> Join Premium</a>
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
              <a href="https://wa.me/918851830081?text=Hi%2C%20I%20want%20to%20join%20Premium%20Health%20Platform" target="_blank" rel="noopener" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">Join Premium on WhatsApp</a>
              <span className="text-xs text-stone-500">Online payment is coming soon — message us and we&apos;ll activate your plan on your account.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">What you get</h2>
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
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Our promise to Premium members</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-700 dark:text-stone-300">
              <li>No ads, ever, while your membership is active</li>
              <li>Paying never changes what a guide says — evidence ratings stay independent</li>
              <li>Cancel any time; your saved plans stay downloadable</li>
              <li>One account works on Premium Health Platform and Royal Fitness Club</li>
            </ul>
          </div>

          <AffiliateProducts limit={6} title="Popular with Premium members" />
        </div>

        <div className="space-y-4">
          <PremiumCTA />
          <WhatsAppOptIn compact />
          <PushPrompt compact />
        </div>
      </div>
    </div>
  );
}
