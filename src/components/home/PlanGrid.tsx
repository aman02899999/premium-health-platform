"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, User } from "lucide-react";
import type { OfferPlan } from "@/lib/offers";
import { formatINR } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

/** Whole months in a duration, counting offer bonus months ("12 months + 2 months" → 14; bonus days don't count). */
export const planMonths = (d: string) =>
  Math.max(
    1,
    d.split("+").reduce((sum, part) => {
      const n = Number(part.match(/\d+/)?.[0] ?? 0);
      return sum + (/year/i.test(part) ? n * 12 : /month/i.test(part) ? n : 0);
    }, 0),
  );

/** payOnline: plan buttons open /join (Razorpay checkout) instead of the free-trial form. */
export function PlanGrid({ plans, note, payOnline = false }: { plans: OfferPlan[]; note: string; payOnline?: boolean }) {
  const hasCouple = plans.some((p) => p.couplePrice > 0);
  const [mode, setMode] = useState<"single" | "couple">("single");
  const couple = mode === "couple" && hasCouple;
  const visible = couple ? plans.filter((p) => p.couplePrice > 0) : plans;

  // Savings are measured against paying the shortest plan's standard monthly rate every month.
  const std = (p: OfferPlan) => p.offer?.standardDuration ?? p.duration;
  const base = [...plans].sort((a, b) => planMonths(std(a)) - planMonths(std(b)))[0];
  const baseMonthly = base ? (couple ? base.couplePrice : (base.offer?.standardPrice ?? base.price)) / planMonths(std(base)) : 0;
  // Rows that fill evenly: 6 → 3×2, 5 → 5 across on wide screens, otherwise up to 4.
  const cols = visible.length === 6 ? "md:grid-cols-2 lg:grid-cols-3" : visible.length === 5 ? "md:grid-cols-3 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-4";

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
          const offer = couple ? undefined : p.offer; // couples pay standard prices
          const duration = couple ? std(p) : p.duration;
          const months = planMonths(duration);
          const price = couple ? p.couplePrice : p.price;
          const perMonth = Math.round(price / months);
          const vsMonthly = Math.round(baseMonthly * planMonths(std(p)));
          // During an offer, show the saving against this plan's own standard price (₹); otherwise %.
          const saveRupees = offer && p.originalPrice > price ? p.originalPrice - price : 0;
          const save = !offer && vsMonthly > price ? Math.round(((vsMonthly - price) / vsMonthly) * 100) : 0;
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
                  {offer && <span className="mb-2 inline-flex w-fit rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">🎉 {offer.title}</span>}
                  <h3 className="font-display text-2xl text-white">{p.name}</h3>
                  <p className="text-sm text-white/55">
                    {offer ? offer.gets : duration}
                    {couple && " · for 2 people"}
                  </p>
                  <div className="pop-3d mt-5">
                    {saveRupees > 0 && <span className="mr-2 text-white/40 line-through">{formatINR(p.originalPrice)}</span>}
                    {saveRupees > 0 && <span className="rounded-full bg-ember/20 px-2 py-0.5 text-xs font-bold text-red-300">Save {formatINR(saveRupees)}</span>}
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
      {plans.some((p) => p.offer) && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-white/45">
          Offer prices and bonus days apply to single memberships paid until {formatOfferEnd(plans)}. Couple plans stay at the regular price.
        </p>
      )}
      {note && <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-white/50">{note}</p>}
    </>
  );
}

const formatOfferEnd = (plans: OfferPlan[]) => {
  const end = plans.find((p) => p.offer)?.offer?.endsOn ?? "";
  const [y, m, d] = end.split("-").map(Number);
  return end ? `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}` : "";
};

function PriceTable({ plans }: { plans: OfferPlan[] }) {
  return (
    <div className="glass mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl">
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="font-display px-6 pt-5 text-left text-xl text-white">Full price list</caption>
        <thead className="text-xs uppercase tracking-wider text-brand">
          <tr>
            <th className="px-4 py-3 sm:px-6">Plan</th>
            <th className="px-4 py-3 sm:px-6">Single</th>
            <th className="px-4 py-3 sm:px-6">Couple</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="px-4 py-3 text-white/80 sm:px-6">
                {p.name}
                <span className="block text-xs text-white/45">{p.offer ? p.offer.gets : p.duration}</span>
              </td>
              <td className="px-4 py-3 font-semibold text-white sm:px-6">
                {formatINR(p.price)}
                {p.originalPrice > p.price && <span className="ml-1.5 text-xs font-normal text-white/40 line-through">{formatINR(p.originalPrice)}</span>}
              </td>
              <td className="px-4 py-3 font-semibold text-brand sm:px-6">{p.couplePrice ? formatINR(p.couplePrice) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
