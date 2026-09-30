import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { ReferralSystem } from "@/components/earning/Referral";
import { PremiumCTA } from "@/components/earning/PremiumCTA";

export const metadata: Metadata = {
  title: "Refer & Earn — Viral Loop Earning",
  description: "Refer friend → both get 7 days premium free, referrer Rs 50 credit — viral loop, SSO + UTM + gtag, SEO optimized.",
  alternates: { canonical: "/referral" },
};

export default function ReferralPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Refer & Earn" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-orange-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Refer & Earn — Viral Loop</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Referral is cheapest CAC — both get 7 days premium free, referrer Rs 50 credit after conversion. SSO + UTM + gtag tracked.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ReferralSystem /></div>
        <div><PremiumCTA compact /></div>
      </div>
    </div>
  );
}
