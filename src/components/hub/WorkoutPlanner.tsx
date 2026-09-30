"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Printer, RotateCcw, Save } from "lucide-react";
import { GOALS, generatePlan, planToText, type PlanDay, type PlanGoal, type Setting } from "@/lib/fitness/planner";
import type { Level } from "@/lib/fitness/exercises";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { useStored } from "./useStored";

function Choice<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/55">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o.v)} type="button" onClick={() => onChange(o.v)} aria-pressed={value === o.v} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${value === o.v ? "bg-brand text-white" : "border border-white/15 text-white/70 hover:text-white"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function WorkoutPlanner({ gymName }: { gymName: string }) {
  const [goal, setGoal] = useState<PlanGoal>("muscle");
  const [days, setDays] = useState(4);
  const [level, setLevel] = useState<Level>("beginner");
  const [setting, setSetting] = useState<Setting>("gym");
  const [saved, setSaved] = useStored<PlanDay[] | null>("rfc-plan", null);
  const [edits, setEdits] = useState<PlanDay[] | null>(null);

  const generated = useMemo(() => generatePlan({ goal, days, level, setting }), [goal, days, level, setting]);
  const plan = edits ?? generated;
  const change = (fn: () => void) => {
    setEdits(null);
    fn();
  };
  const updateItem = (d: number, i: number, key: "sets" | "reps" | "rest", value: string) => {
    const next = plan.map((day, di) =>
      di !== d ? day : { ...day, items: day.items.map((it, ii) => (ii !== i ? it : { ...it, [key]: key === "reps" ? value : Number(value) || 0 })) },
    );
    setEdits(next);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="glass brand-border h-fit space-y-6 rounded-3xl p-6 lg:sticky lg:top-28 print:hidden">
        <Choice label="Goal" value={goal} onChange={(v) => change(() => setGoal(v))} options={GOALS.map((g) => ({ v: g.id, l: g.label }))} />
        <Choice label="Days per week" value={days} onChange={(v) => change(() => setDays(v))} options={[2, 3, 4, 5, 6].map((n) => ({ v: n, l: String(n) }))} />
        <Choice label="Experience" value={level} onChange={(v) => change(() => setLevel(v))} options={[{ v: "beginner", l: "Beginner" }, { v: "intermediate", l: "Intermediate" }, { v: "advanced", l: "Advanced" }]} />
        <Choice label="Where" value={setting} onChange={(v) => change(() => setSetting(v))} options={[{ v: "gym", l: "Gym" }, { v: "home", l: "Home (dumbbells)" }]} />
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
          <button type="button" onClick={() => setSaved(plan)} className="btn-brand inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold">
            <Save className="h-4 w-4" /> Save
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm">
            <Printer className="h-4 w-4" /> Print
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(planToText(plan, gymName))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#25d366] px-4 py-2 text-sm font-bold text-white">
            <WhatsAppIcon className="h-4 w-4" /> Share
          </a>
          {saved && (
            <button type="button" onClick={() => setEdits(saved)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Load saved
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {plan.map((day, d) => (
          <section key={day.title} className="glass rounded-3xl p-5 print:break-inside-avoid print:border print:border-black print:text-black">
            <h3 className="font-display text-xl text-white print:text-black">{day.title}</h3>
            <p className="text-xs uppercase tracking-wider text-brand">{day.focus}</p>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="pb-2">Exercise</th>
                  <th className="w-12 pb-2">Sets</th>
                  <th className="w-20 pb-2">Reps</th>
                  <th className="w-14 pb-2">Rest</th>
                </tr>
              </thead>
              <tbody>
                {day.items.map((it, i) => (
                  <tr key={it.slug} className="border-t border-white/5">
                    <td className="py-2 pr-2">
                      <Link href={`/exercises/${it.slug}`} className="text-white hover:text-brand print:text-black">
                        {it.name}
                      </Link>
                    </td>
                    <td>
                      <input aria-label={`${it.name} sets`} value={it.sets} onChange={(e) => updateItem(d, i, "sets", e.target.value)} inputMode="numeric" className="w-10 rounded bg-black/40 px-1.5 py-1 text-center" />
                    </td>
                    <td>
                      <input aria-label={`${it.name} reps`} value={it.reps} onChange={(e) => updateItem(d, i, "reps", e.target.value)} className="w-16 rounded bg-black/40 px-1.5 py-1 text-center" />
                    </td>
                    <td className="text-white/60">
                      <input aria-label={`${it.name} rest seconds`} value={it.rest} onChange={(e) => updateItem(d, i, "rest", e.target.value)} inputMode="numeric" className="w-11 rounded bg-black/40 px-1.5 py-1 text-center" />s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {day.finisher && <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-xs text-red-200">{day.finisher}</p>}
          </section>
        ))}
        <p className="text-xs text-white/45 md:col-span-2">Warm up 5–10 minutes before every session. Add weight or reps when you hit the top of the rep range with good form.</p>
      </div>
    </div>
  );
}
