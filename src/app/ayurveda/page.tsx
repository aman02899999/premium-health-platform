import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AYURVEDA_TOPICS } from "@/data/editorial";
import { HERBS } from "@/data/herbs";
import { Breadcrumbs, TopicCard, InfoNote, AdSlot, EvidenceBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ayurveda Portal — Basics, Lifestyle, Herbs & Honest Evidence",
  description: "Dosha, dinacharya, ritucharya, nutrition, panchakarma education and herb safety — traditional wisdom distinguished from clinical evidence.",
};

export default function AyurvedaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ayurveda" }]} />
      <div className="hero-pattern mt-3 rounded-3xl border border-emerald-100 p-6 md:p-8 dark:border-stone-700">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600"><Sparkles className="h-4 w-4" /> Traditional wellness, responsibly presented</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">Ayurveda Portal</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-300">Ayurveda offers time-tested lifestyle wisdom — routine, seasonal eating, herbs and mind practices. We present traditional concepts clearly <em>as traditional concepts</em>, separate from modern clinical evidence, so you can integrate safely.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[["Dosha Basics", "/ayurveda/dosha-basics"], ["Dinacharya", "/ayurveda/dinacharya-daily-routine"], ["Nutrition", "/ayurveda/ayurvedic-nutrition"], ["Panchakarma", "/ayurveda/panchakarma-education"], ["All Herbs", "/herbs"]].map(([l, h]) => (
            <Link key={h} href={h} className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">{l}</Link>
          ))}
        </div>
      </div>
      <div className="mt-4"><InfoNote text="Ayurvedic formulations can interact with modern medicines and affect liver/kidney. Always coordinate a qualified Vaidya and your doctor, and buy tested, AYUSH-licensed products." /></div>
      <h2 className="font-display mt-8 text-2xl font-bold">Core topics</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AYURVEDA_TOPICS.map((t) => (
          <TopicCard key={t.slug} href={`/ayurveda/${t.slug}`} title={t.title} hindi={t.category} desc={t.excerpt} icon={<Sparkles className="h-5 w-5" />} />
        ))}
      </div>
      <h2 className="font-display mt-10 text-2xl font-bold">Flagship herbs</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HERBS.slice(0, 4).map((h) => (
          <TopicCard key={h.slug} href={`/herbs/${h.slug}`} title={h.name} hindi={h.hindiName} desc={h.short} badge={<EvidenceBadge level={h.evidenceLevel} />} />
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Ayurveda footer" /></div>
    </div>
  );
}
