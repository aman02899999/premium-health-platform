import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ShieldAlert } from "lucide-react";
import { Breadcrumbs, AdSlot } from "@/components/ui";

export const metadata: Metadata = {
  title: "Child Health — Growth, Nutrition, Fever & Vaccines Basics",
  description: "Parent-friendly primers on growth, anemia, vitamin D, fever care and when children need urgent evaluation.",
};

const TOPICS = [
  { t: "Growth & Protein", d: "Milk + eggs/paneer/soya + pulses daily; track height-weight on growth charts, not neighbours' kids." },
  { t: "Anemia & Vitamin D", d: "Test Hb, ferritin and 25-OH D for fatigue or frequent illness; iron + vitamin C, away from chai." },
  { t: "Fever Care", d: "Paracetamol by weight + fluids; avoid self-antibiotics and NSAIDs if dengue suspected. >3 days or breathless/dehydrated = doctor." },
  { t: "Screen & Sleep", d: "No screens 1 hour before bed; 9–11 hours sleep for schoolkids powers immunity and learning." },
  { t: "Vaccines", d: "Follow the national immunisation schedule via your pediatrician — no delays without medical reason." },
  { t: "Red Flags", d: "Breathing difficulty, persistent vomiting, dehydration, seizures, rash with fever, or unusually sleepy child = urgent care." },
];

export default function ChildPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Child Health" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-800 to-emerald-800 p-6 text-white md:p-8">
        <h1 className="font-display flex items-center gap-2 text-3xl font-black md:text-4xl"><Baby className="h-7 w-7" /> Child Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Parent-friendly primers with extra safety. Doses are weight-based and individual — this site never provides personalised pediatric dosing. Always follow your pediatrician.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Never give aspirin to children, never guess antibiotic doses, and keep iron/paracetamol syrups locked away — accidental overdose is dangerous.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((x) => (
          <div key={x.t} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="font-bold">{x.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{x.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm">Related: <Link href="/diseases/anemia" className="font-bold text-emerald-700 underline">anemia</Link> · <Link href="/diseases/vitamin-d-deficiency" className="font-bold text-emerald-700 underline">vitamin D</Link> · <Link href="/diseases/fever" className="font-bold text-emerald-700 underline">fever guide</Link></p>
      <div className="mt-6"><AdSlot slot="Hub footer" /></div>
    </div>
  );
}
