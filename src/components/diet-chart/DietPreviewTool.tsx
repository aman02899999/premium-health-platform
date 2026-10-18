"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Droplets, Flame, Loader2, Lock, Salad } from "lucide-react";
import type { DietPreview } from "@/lib/diet-pro/preview";

const GOALS = [
  ["fat-loss", "Lose fat"],
  ["recomp", "Lose fat & tone"],
  ["maintain", "Stay the same"],
  ["lean-gain", "Build muscle"],
  ["gain", "Gain weight"],
] as const;
const DIETS = [
  ["veg", "Vegetarian"],
  ["egg", "Veg + eggs"],
  ["nonveg", "Non-veg"],
  ["vegan", "Vegan"],
  ["jain", "Jain"],
] as const;
const ACTIVITY = [
  ["sedentary", "Desk job, no exercise"],
  ["light", "Light (1–2 workouts/week)"],
  ["moderate", "Moderate (3–4/week)"],
  ["active", "Active (5–6/week)"],
  ["athlete", "Very active / sport"],
] as const;
const CUISINES = [
  ["any", "Any Indian"],
  ["north", "North Indian"],
  ["south", "South Indian"],
  ["west", "West Indian"],
  ["east", "East Indian"],
] as const;

export function DietPreviewTool({ trialPrice }: { trialPrice: number }) {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [result, setResult] = useState<DietPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/diet-preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, sex }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't make your plan. Please try again.");
      setResult(json);
      requestAnimationFrame(() => document.getElementById("preview-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="glass brand-border grid gap-4 rounded-3xl p-6 sm:grid-cols-2 sm:p-8">
        <div className="text-sm text-white/75 sm:col-span-2">
          Sex
          <div role="radiogroup" aria-label="Sex" className="mt-1.5 flex gap-2">
            {(["male", "female"] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={sex === s} onClick={() => setSex(s)} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold capitalize ring-1 ${sex === s ? "bg-brand text-white ring-brand" : "bg-white/[.03] text-white/70 ring-white/10"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm text-white/75">
          Age (years)
          <input name="age" required type="number" min={18} max={70} defaultValue={30} className="field mt-1.5" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-white/75">
            Height (cm)
            <input name="heightCm" required type="number" min={130} max={220} defaultValue={170} className="field mt-1.5" />
          </label>
          <label className="text-sm text-white/75">
            Weight (kg)
            <input name="weightKg" required type="number" min={35} max={200} step={0.1} defaultValue={75} className="field mt-1.5" />
          </label>
        </div>
        {(
          [
            ["goal", "Your goal", GOALS],
            ["diet", "Food preference", DIETS],
            ["activity", "Activity", ACTIVITY],
            ["cuisine", "Cuisine", CUISINES],
          ] as const
        ).map(([name, label, opts]) => (
          <label key={name} className="text-sm text-white/75">
            {label}
            <select name={name} defaultValue={name === "activity" ? "moderate" : opts[0][0]} className="field mt-1.5">
              {opts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        ))}
        <p className="text-xs text-white/50 sm:col-span-2">
          Diabetes, thyroid, PCOS, high BP, pregnancy or any medicine? Don&apos;t follow a generic chart: the coach-made plan takes your condition into account.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-300 sm:col-span-2">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Salad className="h-5 w-5" />} Make my free day plan
        </button>
      </form>

      {result && (
        <section id="preview-result" className="scroll-mt-28 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [Flame, `${result.kcal} kcal`, `a day (maintenance ${result.maintenance})`],
              [Salad, `${result.protein} g protein`, `carbs ${result.carb} g · fat ${result.fat} g`],
              [Droplets, `${result.waterL} L water`, "on rest days, more on training days"],
              [ArrowRight, result.weeklyKg ? `${result.weeklyKg > 0 ? "+" : ""}${result.weeklyKg} kg / week` : "Maintain", `BMI ${result.bmi} · ${result.bmiLabel} (Asian cut-offs)`],
            ].map(([Icon, big, small], k) => {
              const I = Icon as typeof Flame;
              return (
                <div key={k} className="glass rounded-2xl p-4">
                  <I className="h-5 w-5 text-brand" />
                  <p className="mt-2 font-display text-2xl text-white">{big as string}</p>
                  <p className="text-xs text-white/55">{small as string}</p>
                </div>
              );
            })}
          </div>
          {result.notes.map((n) => (
            <p key={n} className="rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30">
              {n}
            </p>
          ))}
          <div className="glass rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-2xl text-white">Day 1 — your sample menu</h2>
            <ol className="mt-5 space-y-4">
              {result.meals.map((m) => (
                <li key={m.label} className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-white">
                      {m.label} <span className="font-normal text-white/60">· {m.dish}</span>
                    </span>
                    <span className="text-xs text-white/55">
                      {m.kcal} kcal · {m.protein} g protein
                    </span>
                  </div>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-white/75">
                    {m.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
          <div className="brand-border glass flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="inline-flex items-center gap-2 font-semibold text-white">
                <Lock className="h-4 w-4 text-brand" /> Days 2–7, a workout plan and your coach
              </p>
              <p className="mt-1 text-sm text-white/65">
                The 7-Day Trial Plan for ₹{trialPrice}: a week of varied meals in katori and roti, a training schedule, and a coach who checks it. PDF on WhatsApp and email.
              </p>
            </div>
            <Link href="/diet-chart?plan=trial#order" className="btn-brand inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 font-bold">
              Get the full week for ₹{trialPrice} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
