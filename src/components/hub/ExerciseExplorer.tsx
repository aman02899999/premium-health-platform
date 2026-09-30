"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { EQUIPMENT, EXERCISES, MUSCLES, equipmentLabel, muscleLabel, type Equipment, type Muscle } from "@/lib/fitness/exercises";
import { TiltCard } from "@/components/ui/TiltCard";
import { BodyMap } from "./BodyMap";

const LEVEL_COLOR = { beginner: "text-emerald-300", intermediate: "text-amber-300", advanced: "text-red-300" };

export function ExerciseExplorer() {
  const [muscle, setMuscle] = useState<Muscle | "all">("all");
  const [equip, setEquip] = useState<Equipment | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (muscle === "all" || e.primary === muscle || e.secondary.includes(muscle)) &&
        (equip === "all" || e.equipment === equip) &&
        (!needle || `${e.name} ${e.summary}`.toLowerCase().includes(needle)),
    ).sort((a, b) => Number(b.primary === muscle) - Number(a.primary === muscle));
  }, [muscle, equip, q]);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="glass brand-border h-fit rounded-3xl p-5 lg:sticky lg:top-28">
        <BodyMap selected={muscle} onSelect={setMuscle} />
      </aside>
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ id: "all" as const, label: "All muscles" }, ...MUSCLES].map((m) => (
            <button key={m.id} type="button" onClick={() => setMuscle(m.id)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${muscle === m.id ? "bg-brand text-white" : "border border-white/15 text-white/70 hover:text-white"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <select value={equip} onChange={(e) => setEquip(e.target.value as Equipment | "all")} className="field sm:w-48" aria-label="Equipment">
            <option value="all">All equipment</option>
            {EQUIPMENT.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <label className="relative block flex-1">
            <span className="sr-only">Search exercises</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search exercises…" className="field pl-9" />
          </label>
        </div>
        <p className="mb-4 text-sm text-white/50" aria-live="polite">
          {list.length} exercise{list.length === 1 ? "" : "s"}
          {muscle !== "all" && ` for ${muscleLabel(muscle).toLowerCase()}`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <TiltCard key={e.slug} className="group h-full rounded-2xl" max={8}>
              <Link href={`/exercises/${e.slug}`} className="glass flex h-full flex-col rounded-2xl p-5 hover:ring-1 hover:ring-brand/50">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand">{muscleLabel(e.primary)}</span>
                <span className="mt-1 text-lg font-bold text-white">{e.name}</span>
                <span className="mt-2 flex-1 text-sm text-white/60">{e.summary}</span>
                <span className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/50">
                    {equipmentLabel(e.equipment)} · <span className={`capitalize ${LEVEL_COLOR[e.level]}`}>{e.level}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </div>
  );
}
