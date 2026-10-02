"use client";

import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { cn } from "@/health/lib/format";

export type Tone = "ok" | "warn" | "alert";

/**
 * Number input that lets people type freely ("1" on the way to "168") and only
 * clamps to [min, max] when they leave the field. Out-of-range values show a hint.
 */
export function NumField({ label, value, onChange, min, max, step = 1, unit, hint }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; unit?: string; hint?: string }) {
  const id = useId();
  const [text, setText] = useState(String(value));
  // Follow outside changes (e.g. a unit switch) without an effect.
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setText(String(value));
  }
  const n = Number(text);
  const invalid = text.trim() === "" || !Number.isFinite(n) || n < min || n > max;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">{label}{unit && <span className="font-normal text-stone-400">{unit}</span>}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        aria-invalid={invalid}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value.trim() !== "" && Number.isFinite(v) && v >= min && v <= max) onChange(v);
        }}
        onBlur={() => {
          const v = Number.isFinite(n) && text.trim() !== "" ? Math.min(max, Math.max(min, n)) : value;
          setText(String(v));
          onChange(v);
        }}
        className={cn("h-11 w-full rounded-xl border bg-stone-50 px-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-stone-800", invalid ? "border-amber-400" : "border-stone-200 dark:border-stone-700")}
      />
      {invalid ? <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-300">Enter {min}–{max}{unit ? ` ${unit}` : ""}</span> : hint ? <span className="mt-1 block text-[11px] text-stone-400">{hint}</span> : null}
    </label>
  );
}

export function DateField({ label, value, onChange, max, min, hint }: { label: string; value: string; onChange: (v: string) => void; max?: string; min?: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">{label}</span>
      <input id={id} type="date" value={value} max={max} min={min} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-800" />
      {hint && <span className="mt-1 block text-[11px] text-stone-400">{hint}</span>}
    </label>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition", value === o.value ? "bg-white text-emerald-800 shadow-sm dark:bg-stone-900 dark:text-emerald-300" : "text-stone-500 hover:text-stone-800 dark:text-stone-400")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function SelectField<T extends string | number>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">{label}</span>
      <select id={id} value={String(value)} onChange={(e) => onChange((typeof value === "number" ? Number(e.target.value) : e.target.value) as T)} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800">
        {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6 dark:border-stone-700 dark:bg-stone-900", className)}>
      {title && <h2 className="font-display mb-4 text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone }) {
  return (
    <div className={cn("rounded-2xl border p-4", tone === "ok" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40" : tone === "warn" ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40" : tone === "alert" ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40" : "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/60")}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      <p className="font-display mt-1 text-2xl font-black leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">{sub}</p>}
    </div>
  );
}

export function Note({ tone = "ok", children }: { tone?: Tone; children: React.ReactNode }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "warn" ? AlertTriangle : OctagonAlert;
  return (
    <div className={cn("flex gap-2 rounded-xl p-3 text-sm", tone === "ok" && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100", tone === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100", tone === "alert" && "bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100")}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Formats a UTC calendar date for India, e.g. "Thu, 8 Oct 2026". */
export const fmtDate = (d: Date, withDay = true) =>
  d.toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", ...(withDay ? { weekday: "short" } : {}) });
