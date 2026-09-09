import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";

export const metadata: Metadata = {
  title: "Women's Health — PCOS, Periods, Pregnancy, Thyroid & More",
  description: "Indian women's health hub: menstrual health, PCOS, thyroid, anemia, pregnancy nutrition and menopause with responsible guidance.",
};

export default function WomensPage() {
  const slugs = ["pcos", "menstrual-health", "pregnancy-nutrition", "iron-deficiency", "hypothyroidism", "menopause", "anemia", "fertility", "breast-health"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Women's Health" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-800 via-pink-800 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Women&apos;s Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Periods, PCOS, thyroid, anemia, pregnancy and menopause — explained kindly, with nutrition, tests and when to seek care. Pregnancy content carries extra safety warnings.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
      </div>
      <p className="mt-6 text-sm">Also read: <Link href="/blog/pcos-complete-guide-indian-women" className="font-bold text-emerald-700 underline">PCOS complete guide</Link> · <Link href="/diet" className="font-bold text-emerald-700 underline">PCOS nutrition plan</Link></p>
      <div className="mt-6"><AdSlot slot="Hub footer" /></div>
    </div>
  );
}
