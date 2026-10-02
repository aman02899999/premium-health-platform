"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Apple, Award, Dumbbell, ExternalLink, Milk, Pill, Zap } from "lucide-react";
import { STORE_CATEGORIES, storeLink, type StoreCategory, type StoreProduct } from "@/lib/store/supplements";

const ICONS: Record<StoreCategory, typeof Milk> = {
  Protein: Milk,
  "Creatine & Recovery": Zap,
  "Health Basics": Pill,
  "Healthy Snacks": Apple,
  "Gym Gear": Dumbbell,
};

/** Category filter + product cards for the supplement store. */
export function StoreGrid({ products }: { products: StoreProduct[] }) {
  const [cat, setCat] = useState<StoreCategory | "All">("All");
  const shown = useMemo(() => (cat === "All" ? products : products.filter((p) => p.category === cat)), [products, cat]);
  const blurb = STORE_CATEGORIES.find((c) => c.name === cat)?.blurb;
  const chip = (c: string) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${cat === c ? "border-brand bg-brand text-white" : "border-white/15 text-white/70 hover:border-white/40"}`;

  return (
    <div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter by category">
        {(["All", ...STORE_CATEGORIES.map((c) => c.name)] as const).map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={chip(c)}>
            {c}
          </button>
        ))}
      </div>
      <p className="mb-8 min-h-[1.5rem] text-sm text-white/55">{blurb}</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => {
          const Icon = ICONS[p.category];
          return (
            <li key={p.id} className="glass group relative flex flex-col overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1 hover:ring-1 hover:ring-brand/50">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/20" />
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/30 to-navy/40 ring-1 ring-white/10">
                  <Icon className="h-6 w-6 text-white" />
                </span>
                {p.pick && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <Award className="h-3.5 w-3.5" /> Coach&apos;s pick
                  </span>
                )}
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{p.brand}</p>
              <h3 className="font-display mt-1 text-xl leading-snug text-white">{p.name}</h3>
              <p className="mt-3 text-sm text-white/75">{p.why}</p>
              <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-white/65">
                <strong className="text-white/85">How to use:</strong> {p.use}
              </p>
              {p.caution && (
                <p className="mt-2 flex gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-100/90">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {p.caution}
                </p>
              )}
              <div className="mt-auto pt-5">
                <a
                  href={storeLink(p)}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="btn-brand flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold"
                >
                  Check price on Amazon <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
