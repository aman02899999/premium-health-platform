import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Breadcrumbs, AdSlot, InfoNote } from "@/components/ui";

export const metadata: Metadata = {
  title: "Yoga & Fitness — Indian Plans for Sugar, BP, Back & Sleep",
  description: "Beginner yoga sequences, walking plans and strength basics with safety modifications for knees, heart, pregnancy and seniors.",
};

const PLANS = [
  { title: "Morning 20 for Blood Sugar", desc: "Warm-up walk + standing flow (Tadasana, Trikonasana, Virabhadrasana) + Anulom-Vilom. Pair with 10-min post-meal walks.", tags: ["Diabetes", "Beginner"] },
  { title: "Desk-Worker Back Rescue", desc: "Cat-cow, Bhujangasana, Setu Bandha + core (dead-bug, bird-dog). 15 min/day + hourly stand breaks.", tags: ["Back pain", "Posture"] },
  { title: "BP-Friendly Movement", desc: "Brisk walking 30 min + slow yoga + Bhramari breathing. Avoid breath-holding inversions with uncontrolled BP.", tags: ["Hypertension", "Walking"] },
  { title: "Senior Strength & Balance", desc: "Chair squats, wall push-ups, heel raises + single-leg balance with support. 2x/week + daily walk.", tags: ["Seniors", "Falls"] },
  { title: "PCOS Power Trio", desc: "Strength 3x/week (squat, row, press) + 8k steps + sleep 8h. Insulin sensitivity responds in weeks.", tags: ["PCOS", "Strength"] },
  { title: "Sleep-Wind-Down Flow", desc: "Gentle forward folds, Supta Baddha Konasana, Yoga Nidra 15 min. Screens off 60 min before.", tags: ["Sleep", "Stress"] },
];

export default function YogaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Yoga & Fitness" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-teal-800 via-emerald-800 to-amber-700 p-6 text-white md:p-8">
        <h1 className="font-display flex items-center gap-2 text-3xl font-black md:text-4xl"><Activity className="h-7 w-7" /> Yoga & Fitness</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">Practical Indian movement plans — yoga, walking and strength — with safety modifications. Movement supports sugar, BP, sleep and mood; it complements medicines, never replaces them without supervision.</p>
      </div>
      <div className="mt-4"><InfoNote text="Uncontrolled BP (>160/100), chest pain, severe breathlessness, acute disc prolapse, recent surgery or high-risk pregnancy: get medical clearance before starting. Stop and seek care for chest pain, fainting or severe joint pain." /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <article key={p.title} className="card-3d rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{t}</span>)}</div>
            <h3 className="font-display mt-2 text-lg font-bold">{p.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{p.desc}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm">Go deeper: <Link href="/diseases/type-2-diabetes" className="font-bold text-emerald-700 underline">diabetes + exercise</Link> · <Link href="/diseases/back-pain" className="font-bold text-emerald-700 underline">back pain</Link> · <Link href="/blog/yoga-blood-sugar-beginners" className="font-bold text-emerald-700 underline">yoga for sugar guide</Link></p>
      <div className="mt-6"><AdSlot slot="Yoga footer" /></div>
    </div>
  );
}
