import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Phone } from "lucide-react";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";
import { getDisease } from "@/data/diseases-index";

export const metadata: Metadata = {
  title: "Mental Wellness — Anxiety, Depression, Stress & Sleep",
  description: "Compassionate, stigma-free explainers on anxiety, depression, stress and insomnia with self-care and when to seek professional help.",
};

export default function MentalPage() {
  const slugs = ["anxiety", "depression", "stress", "sleep-problems", "brain-health", "headache"];
  const items = slugs.map(getDisease).filter(Boolean);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mental Wellness" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display flex items-center gap-2 text-3xl font-black md:text-4xl"><Brain className="h-7 w-7" /> Mental Wellness</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Anxiety, low mood, stress and poor sleep are health conditions — not character flaws. Learn self-care foundations and when professional help (therapy, medicines) helps most.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> If you have thoughts of harming yourself, reach out immediately — call India&apos;s Tele-MANAS helpline 14416 or 1-800-891-4416, or go to your nearest emergency. You deserve support right now.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => d && <TopicCard key={d.slug} href={`/diseases/${d.slug}`} title={d.name} hindi={d.hindiName} desc={d.short} />)}
      </div>
      <div className="mt-6 grid gap-4 rounded-3xl border border-stone-200 bg-white p-6 text-sm leading-relaxed md:grid-cols-3 dark:border-stone-700 dark:bg-stone-900">
        <div><h3 className="font-bold">Daily foundations</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Fixed wake time, morning light, 30-min walk, limited alcohol/caffeine, screens off before bed.</p></div>
        <div><h3 className="font-bold">Talk helps</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Trusted friend, counsellor or psychiatrist — therapy and medicines are effective, especially combined.</p></div>
        <div><h3 className="font-bold">Check the body</h3><p className="mt-1 text-stone-600 dark:text-stone-300">Thyroid, B12, D, anemia and sleep apnea mimic low mood — rule them out via <Link href="/lab-tests/tsh" className="text-emerald-700 underline">TSH</Link> + basics.</p></div>
      </div>
      <div className="mt-6"><AdSlot slot="Hub footer" /></div>
    </div>
  );
}
