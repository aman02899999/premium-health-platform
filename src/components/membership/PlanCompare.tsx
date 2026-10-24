import { Check, Minus } from "lucide-react";
import type { OfferPlan } from "@/lib/offers";
import { basePlan, perMonth, planFeatures, planSummary, savingPct } from "@/lib/content/plans";
import { formatINR } from "@/lib/site";

/** Side-by-side matrix of every plan: price, per-month cost, couple price and included features. */
export function PlanMatrix({ plans }: { plans: OfferPlan[] }) {
  const { features, has } = planFeatures(plans);
  const base = basePlan(plans);
  const hasCouple = plans.some((p) => p.couplePrice > 0);
  const row = "border-b border-white/5";
  const cell = "px-4 py-3 text-center";
  return (
    <div role="region" aria-label="Plan comparison table" tabIndex={0} className="glass brand-border overflow-x-auto rounded-3xl">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Membership plans compared</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
              Plan
            </th>
            {plans.map((p) => (
              <th key={p.id} scope="col" className={`px-4 py-4 text-center font-display text-lg ${p.featured ? "text-brand" : "text-white"}`}>
                {p.name}
                {p.featured && <span className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-brand">Most popular</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-white/80">
          <tr className={row}>
            <th scope="row" className="px-4 py-3 text-left font-medium text-white/60">Duration</th>
            {plans.map((p) => <td key={p.id} className={cell}>{p.duration}</td>)}
          </tr>
          <tr className={row}>
            <th scope="row" className="px-4 py-3 text-left font-medium text-white/60">Price (1 person)</th>
            {plans.map((p) => <td key={p.id} className={`${cell} font-semibold text-white`}>{formatINR(p.price)}</td>)}
          </tr>
          <tr className={row}>
            <th scope="row" className="px-4 py-3 text-left font-medium text-white/60">Per month</th>
            {plans.map((p) => <td key={p.id} className={cell}>≈ {formatINR(perMonth(p))}</td>)}
          </tr>
          <tr className={row}>
            <th scope="row" className="px-4 py-3 text-left font-medium text-white/60">Saving vs {base?.name ?? "monthly"} rate</th>
            {plans.map((p) => {
              const pct = savingPct(p, base);
              return <td key={p.id} className={`${cell} ${pct ? "text-emerald-300" : "text-white/40"}`}>{pct ? `${pct}%` : "—"}</td>;
            })}
          </tr>
          {hasCouple && (
            <tr className={row}>
              <th scope="row" className="px-4 py-3 text-left font-medium text-white/60">Couple (2 people)</th>
              {plans.map((p) => <td key={p.id} className={cell}>{p.couplePrice > 0 ? formatINR(p.couplePrice) : "—"}</td>)}
            </tr>
          )}
          {features.map((f) => (
            <tr key={f} className={row}>
              <th scope="row" className="px-4 py-3 text-left font-medium text-white/70">{f}</th>
              {plans.map((p) => (
                <td key={p.id} className={cell}>
                  {has(p.id, f) ? <Check className="mx-auto h-4 w-4 text-brand" aria-label="Included" /> : <Minus className="mx-auto h-4 w-4 text-white/25" aria-label="Not included" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One short paragraph per plan. */
export function PlanSummaries({ plans }: { plans: OfferPlan[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {plans.map((p) => (
        <article key={p.id} className="glass rounded-2xl p-6 ring-1 ring-white/10">
          <h3 className="font-display text-xl text-white">
            {p.name} <span className="text-base text-white/50">· {formatINR(p.price)}</span>
          </h3>
          <p className="mt-3 text-white/70">{planSummary(p, plans)}</p>
        </article>
      ))}
    </div>
  );
}
