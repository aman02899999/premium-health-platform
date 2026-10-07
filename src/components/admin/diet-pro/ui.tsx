"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/** Glass card with a subtle 3D tilt that follows the pointer (off for reduced motion). */
export function Tilt({ children, className = "", strength = 4 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1100px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateZ(0)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
      className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}

export function Section({ title, icon, children, defaultOpen = true }: { title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-white">
        {icon}
        {title}
        <span className="ml-auto text-white/40 transition group-open:rotate-90">›</span>
      </summary>
      <div className="grid gap-3 px-4 pb-4">{children}</div>
    </details>
  );
}

/** Number input that allows free typing and clamps on blur. Empty = undefined when `optional`. */
export function Num({ label, value, onChange, min, max, step = 1, unit, optional, hint }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; min: number; max: number; step?: number; unit?: string; optional?: boolean; hint?: string }) {
  const id = useId();
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setText(value === undefined ? "" : String(value));
  }
  const n = Number(text);
  const empty = text.trim() === "";
  const bad = (!empty && (!Number.isFinite(n) || n < min || n > max)) || (empty && !optional);
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-white/55">
        {label}
        {unit && <span className="normal-case text-white/35">{unit}</span>}
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        placeholder={optional ? "—" : undefined}
        aria-invalid={bad}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value.trim() === "") {
            if (optional) onChange(undefined);
          } else if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
        }}
        onBlur={() => {
          if (empty) {
            if (!optional) setText(String(value ?? min));
            return;
          }
          const v = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : (value ?? min);
          setText(String(v));
          onChange(v);
        }}
        className={`h-10 w-full rounded-xl border bg-black/30 px-3 text-sm text-white outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20 ${bad ? "border-amber-400/70" : "border-white/10"}`}
      />
      {bad ? <span className="mt-0.5 block text-[10px] text-amber-300">Enter {min}–{max}</span> : hint ? <span className="mt-0.5 block text-[10px] text-white/35">{hint}</span> : null}
    </label>
  );
}

export function Choice<T extends string | number>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl bg-black/30 p-1">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-8 flex-1 rounded-lg px-2.5 text-xs font-bold transition ${value === o.value ? "bg-brand text-white shadow-[0_6px_18px_-6px_rgba(232,57,75,0.8)]" : "text-white/55 hover:text-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-sky">
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-coal">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${checked ? "border-brand/60 bg-brand/15 text-white" : "border-white/10 bg-black/20 text-white/60"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#e8394b]" />
      {label}
    </label>
  );
}

const TONE = { ok: "from-emerald-400/25 text-emerald-200 ring-emerald-400/30", warn: "from-amber-400/25 text-amber-200 ring-amber-400/30", alert: "from-rose-500/30 text-rose-200 ring-rose-400/40", none: "from-white/10 text-white/80 ring-white/10" };

export function Kpi({ label, value, sub, tone = "none" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: keyof typeof TONE }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br to-transparent p-3 ring-1 ${TONE[tone]} shadow-[0_18px_30px_-20px_rgba(0,0,0,0.9)]`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
      <p className="font-display mt-1 text-2xl leading-none text-white">{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug">{sub}</p>}
    </div>
  );
}
