import type { Metadata } from "next";
import SolutionsClient from "./SolutionsClient";
import { Breadcrumbs, AdSlot, DisclaimerBar, Newsletter } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Every Medical Solution — Modern, Ayurveda, Herbs, Nutrition & Lifestyle Compared",
  description: "One finder for every condition: modern treatment, Ayurvedic view, nutrition, yoga, tests and emergency red flags — responsibly compared with evidence grades.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: `Medical Solutions Finder | ${SITE.name}`,
    description: "Every condition, every responsible solution pillar, side by side.",
    type: "website",
    url: `${SITE.url}/solutions`,
  },
};

export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Medical Solutions" }]} />
      <div className="relative mt-3 overflow-hidden rounded-3xl bg-stone-950 p-6 text-white md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">Modern · Ayurveda · Herbs · Nutrition · Yoga · Mind</p>
        <h1 className="font-display mt-2 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Every condition. Every responsible solution. One page.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-[15px]">
          No single system has all answers. Compare modern treatment, Ayurvedic perspective, nutrition, lifestyle and testing for 24 common
          Indian conditions — with evidence grades and emergency red flags on every card.
        </p>
      </div>
      <div className="mt-8"><SolutionsClient /></div>
      <div className="mt-8 space-y-6"><AdSlot slot="Solutions footer" /><Newsletter compact /><DisclaimerBar /></div>
    </div>
  );
}
