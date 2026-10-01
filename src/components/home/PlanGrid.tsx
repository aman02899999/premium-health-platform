"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, User } from "lucide-react";
import type { Plan } from "@/lib/content/types";
import { formatINR } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

export const planMonths = (d: string) => Number(d.match(/\d+/)?.[0] ?? 1) * (/year/i.test(d) ? 12 : 1);

/** payOnline: plan buttons open /join (Razorpay checkout) instead of the free-trial form. */
export function PlanGrid({ plans, note, payOnline = false }: { plans: Plan[]; note: string; payOnline?: boolean }) {
  const hasCouple = plans.some((p) => p.couplePrice > 0);
  const [mode, setMode] = useState<"single" | "couple">("single");
  const couple = mode === "couple" && hasCouple;
  const visible = couple ? plans.filter((p) => p.couplePrice > 0) : plans;

  // Savings are measured against paying the shortest plan's monthly rate every month.
  const base = [...plans].sort((a, b) => planMonths(a.duration) - planMonths(b.duration))[0];
  const baseMonthly = base ? (couple ? base.couplePrice : base.price) / planMonths(base.duration) : 0;
  const cols = visible.length >= 5 ? "md:grid-cols-3 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-4";

  return (
    <>
      {hasCouple && (
        <div className="mb-10 flex justify-center">
          <div role="radiogroup" aria-label="Membership type" className="glass inline-flex rounded-full p-1.5">
            {(
              [
                { v: "single", l: "Single", icon: User },
                { v: "couple", l: "Couple", icon: Heart },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                role="radio"
                aria-checked={mode === o.v}
                onClick={() => setMode(o.v)}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${mode === o.v ? "bg-brand text-white shadow-lg" : "text-white/70 hover:text-white"}`}
              >
                <o.icon className="h-4 w-4" /> {o.l}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`grid gap-6 ${cols}`}>
        {visible.map((p, i) => {
          const months = planMonths(p.duration);
          const price = couple ? p.couplePrice : p.price;
          const perMonth = Math.round(price / months);
          const vsMonthly = Math.round(baseMonthly * months);
          const save = vsMonthly > price ? Math.round(((vsMonthly - price) / vsMonthly) * 100) : 0;
          const perPerson = couple ? Math.round(price / 2) : 0;
          return (
            <Reveal key={p.id} delay={i * 80}>
              <TiltCard className="h-full rounded-3xl" max={7}>
                <article className={`relative flex h-full flex-col rounded-3xl p-6 ${p.featured ? "bg-gradient-to-b from-navy via-[#0b2a44] to-coal ring-2 ring-brand" : "glass brand-border"}`}>
                  {p.featured && (
                    <span className="pop-3d absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-display text-2xl text-white">{p.name}</h3>
                  <p className="text-sm text-white/55">
                    {p.duration}
                    {couple && " · for 2 people"}
                  </p>
                  <div className="pop-3d mt-5">
                    {p.originalPrice > price && !couple && <span className="mr-2 text-white/40 line-through">{formatINR(p.originalPrice)}</span>}
                    {save > 0 && <span className="rounded-full bg-ember/20 px-2 py-0.5 text-xs font-bold text-red-300">Save {save}%</span>}
                    <div className="font-display mt-1 text-4xl text-brand-gradient xl:text-[2.6rem]">{formatINR(price)}</div>
                    <p className="mt-1 text-sm text-white/55">
                      ≈ {formatINR(perMonth)} / month{couple && ` · ${formatINR(perPerson)} each`}
                    </p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-white/80">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={payOnline ? `/join?plan=${encodeURIComponent(p.id)}${couple ? "&couple=1" : ""}` : "/contact#trial"}
                    className={`mt-6 block rounded-full py-3 text-center font-bold ${p.featured ? "btn-brand" : "border border-brand/50 text-brand hover:bg-brand hover:text-white"}`}
                  >
                    {payOnline ? `Join ${p.name} online` : `Join ${p.name}`}
                  </Link>
                </article>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
      {hasCouple && <PriceTable plans={plans} />}
      {note && <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-white/50">{note}</p>}
    </>
  );
}

function PriceTable({ plans }: { plans: Plan[] }) {
  return (
    <div className="glass mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl">
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="font-display px-6 pt-5 text-left text-xl text-white">Full price list</caption>
        <thead className="text-xs uppercase tracking-wider text-brand">
          <tr>
            <th className="px-6 py-3">Duration</th>
            <th className="px-6 py-3">Single</th>
            <th className="px-6 py-3">Couple</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="px-6 py-3 text-white/80">{p.duration}</td>
              <td className="px-6 py-3 font-semibold text-white">{formatINR(p.price)}</td>
              <td className="px-6 py-3 font-semibold text-brand">{p.couplePrice ? formatINR(p.couplePrice) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
