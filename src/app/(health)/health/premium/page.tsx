import type { Metadata } from "next";
import { Breadcrumbs } from "@/health/components/ui";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";
import { WhatsAppOptIn, PushPrompt } from "@/health/components/marketing/WhatsAppOptIn";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium (Coming Soon) — Join the Waitlist",
  description: "Premium Health Platform Premium is in development: ad-free reading, saved meal plans and PDF exports. Join the waitlist — every tool stays free.",
  alternates: { canonical: "/health/premium" },
};

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Premium" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-amber-900 p-8 text-white md:p-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300"><Crown className="h-4 w-4" /> Premium · coming soon</p>
        <h1 className="font-display mt-2 text-4xl font-black">Premium is in the works</h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-100/90">An optional plan for ad-free reading, saved plans and PDF exports. It isn&apos;t on sale yet and we take no payments for it — join the waitlist and we&apos;ll tell you when it launches. Every calculator and guide stays free.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://wa.me/918851830081?text=Hi%2C%20please%20add%20me%20to%20the%20Premium%20Health%20Platform%20waitlist" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400"><Zap className="h-4 w-4" /> Join the waitlist</a>
          <Link href="/health/health-calculators" className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold hover:bg-white/10">Use the free tools</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">What we&apos;re planning</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b text-stone-500"><th className="py-2">Feature</th><th>Free (today)</th><th>Premium (planned)</th></tr></thead>
                <tbody className="text-sm">
                  <tr className="border-b"><td className="py-2">All calculators, guides and tools</td><td>✓</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">Ad-free reading</td><td>—</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">PDF export of plans and results</td><td>—</td><td>✓</td></tr>
                  <tr className="border-b"><td className="py-2">Save plans and calculator history</td><td>—</td><td>✓</td></tr>
                                    <tr><td className="py-2">Weekly health email</td><td>✓</td><td>✓</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="https://wa.me/918851830081?text=Hi%2C%20I%20want%20to%20join%20Premium%20Health%20Platform" target="_blank" rel="noopener" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">Join the waitlist on WhatsApp</a>
              <span className="text-xs text-stone-500">Price and launch date aren&apos;t set yet. No payment is taken now.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">What Premium will include</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              {[
                "Ad-free reading across every guide",
                "Save thali plans and calculator results",
                "PDF export of meal plans and reports",
                "Growth-tracker history for children",
                "Early access to new tools",
                "Everything that is free today stays free",
              ].map((f) => (
                <p key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Our promise</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-700 dark:text-stone-300">
              <li>We won&apos;t take money until the features above actually work</li>
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
