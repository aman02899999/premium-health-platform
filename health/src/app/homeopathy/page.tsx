import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, EvidenceBadge, SafetyNote, AdSlot, FaqAccordion } from "@/components/ui";

export const metadata: Metadata = {
  title: "Homeopathy — Principles, Remedies & Honest Evidence Status",
  description: "History, principles, commonly discussed remedies, evidence status, limitations and safety. Never a replacement for effective treatment of serious disease.",
};

const REMEDIES = [
  { name: "Arnica montana", use: "Traditionally discussed for bruises and soreness.", evidence: "insufficient" as const },
  { name: "Nux vomica", use: "Traditionally discussed for acidity and hangover-type symptoms.", evidence: "insufficient" as const },
  { name: "Rhus tox", use: "Traditionally discussed for joint stiffness.", evidence: "insufficient" as const },
  { name: "Belladonna", use: "Traditionally discussed for sudden fever/headache.", evidence: "insufficient" as const },
  { name: "Aconite", use: "Traditionally discussed for early cold onset.", evidence: "insufficient" as const },
  { name: "Sulphur", use: "Traditionally discussed for itchy skin.", evidence: "insufficient" as const },
];

export default function HomeopathyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Homeopathy" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-indigo-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Homeopathy, explained honestly</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">History, principles, commonly discussed remedies — with clear evidence status, limitations and safety. We never encourage replacing effective treatment for serious disease.</p>
      </div>
      <div className="mt-4"><SafetyNote text="For diabetes, heart disease, asthma, infections, cancer and emergencies, homeopathy must never replace proven medical treatment. Delay can cause irreversible harm. Always inform your doctor about all products you use." /></div>
      <div className="prose-health mt-6 space-y-4 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-50">History & principles</h2>
          <p className="mt-2">Founded by Samuel Hahnemann in the late 1700s, homeopathy rests on “like cures like” (similia) and ultra-dilution with succussion. Remedies are labelled by dilution (6C, 30C, 200C) — higher numbers mean <em>less</em> original substance, often none detectable. Classical homeopaths individualise remedies after long interviews; commercial combinations generalise.</p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-50">Evidence status</h2>
          <p className="mt-2">Large independent reviews (including Australian NHMRC and UK House of Commons assessments) found no reliable evidence that homeopathy works beyond placebo for any condition. Small positive trials exist but are generally low-quality with bias risk. The plausible mechanism conflicts with chemistry and pharmacology at high dilutions.</p>
          <div className="mt-3"><EvidenceBadge level="insufficient" /></div>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-50">Commonly discussed remedies (traditional claims)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {REMEDIES.map((r) => (
              <div key={r.name} className="rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
                <p className="font-bold">{r.name}</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{r.use}</p>
                <div className="mt-2"><EvidenceBadge level={r.evidence} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-stone-500">Low-dilution (mother tincture) products can contain active/toxic substances and interact with medicines — “homeopathic” on the label does not guarantee zero risk.</p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display mb-3 text-xl font-bold text-stone-900 dark:text-stone-50">FAQs</h2>
          <FaqAccordion faqs={[
            { q: "Is homeopathy safe?", a: "High dilutions are usually pharmacologically inert, but risks come from delaying effective care, low-dilution toxicity, contamination and interactions. Safety means safe use in context — not automatic safety." },
            { q: "Can I use it alongside my medicines?", a: "Discuss openly with your doctor. Never stop or reduce prescribed medicines for homeopathy without supervision, especially for diabetes, heart, thyroid, asthma or mental-health conditions." },
            { q: "Why do some people feel better?", a: "Placebo response, natural fluctuation, regression to the mean, attentive consultations and concurrent lifestyle changes all contribute. Feeling better matters — but it doesn't prove disease modification." },
          ]} />
        </section>
      </div>
      <p className="mt-6 text-sm">Explore proven approaches: <Link href="/diseases" className="font-bold text-emerald-700 underline">diseases</Link> · <Link href="/medicines" className="font-bold text-emerald-700 underline">medicines</Link> · <Link href="/ayurveda" className="font-bold text-emerald-700 underline">ayurveda</Link></p>
      <div className="mt-6"><AdSlot slot="Homeopathy footer" /></div>
    </div>
  );
}
