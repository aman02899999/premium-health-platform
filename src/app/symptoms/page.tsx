import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Siren } from "lucide-react";
import { SYMPTOMS } from "@/data/clinical";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";
import { SymptomChecker } from "@/components/tools";

export const metadata: Metadata = {
  title: "Symptom Checker — Educational Triage (Not a Diagnosis)",
  description: "Explore symptoms by urgency, questions to consider and when to seek care. Emergency symptoms trigger prominent warnings.",
};

const URGENCY_COLOR: Record<string, string> = {
  "self-care": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  routine: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  prompt: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  emergency: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function SymptomsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Symptoms" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-rose-900 via-red-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Symptom Navigator</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Educational triage only — <strong>never a diagnosis</strong>. Select a symptom to see possible categories, questions to consider and urgency. Emergency patterns show prominent warnings.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-red-500/20 p-3 text-xs"><Siren className="mt-0.5 h-4 w-4 shrink-0" /> Chest pain, severe breathlessness, stroke signs, severe bleeding or loss of consciousness need emergency care immediately — do not use this tool instead.</p>
      </div>
      <h2 className="font-display mt-8 text-2xl font-bold">Interactive checker</h2>
      <div className="mt-4"><SymptomChecker /></div>
      <h2 className="font-display mt-10 text-2xl font-bold">Browse symptoms</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SYMPTOMS.map((s) => (
          <TopicCard key={s.slug} href={`/symptoms/${s.slug}`} title={s.name} desc={s.short} icon={<Activity className="h-5 w-5" />} badge={<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${URGENCY_COLOR[s.urgency]}`}>{s.urgency}</span>} />
        ))}
      </div>
      <p className="mt-6 text-sm text-stone-600">Related: <Link href="/diseases" className="font-bold text-emerald-700 underline">diseases</Link> · <Link href="/lab-tests" className="font-bold text-emerald-700 underline">lab tests</Link></p>
      <div className="mt-6"><AdSlot slot="Directory footer" /></div>
    </div>
  );
}
