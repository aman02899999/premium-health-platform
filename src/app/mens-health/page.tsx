import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";

export const metadata: Metadata = {
  title: "Men's Health — Heart, Prostate, Testosterone, Weight & Fitness",
  description: "Indian men's health hub: early heart risk, belly fat, prostate, testosterone and healthy aging with practical plans.",
};

export default function MensPage() {
  const slugs = ["mens-heart-health", "mens-weight-management", "prostate-health", "testosterone-health", "male-pattern-hair-loss", "erectile-dysfunction", "mens-nutrition", "mens-fitness", "mens-healthy-aging"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Men's Health" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Men&apos;s Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Indian men face heart attacks a decade early — belly fat, smoking, sleep apnea and unchecked BP/sugar drive it. Practical, stigma-free guides below.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
      </div>
      <p className="mt-6 text-sm">Start here: <Link href="/health-calculators" className="font-bold text-emerald-700 underline">heart-risk + BMI calculators</Link> · <Link href="/diseases/mens-heart-health" className="font-bold text-emerald-700 underline">men&apos;s heart guide</Link></p>
      <div className="mt-6"><AdSlot slot="Hub footer" /></div>
    </div>
  );
}
