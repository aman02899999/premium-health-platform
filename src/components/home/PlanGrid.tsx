"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, User } from "lucide-react";
import type { OfferPlan } from "@/lib/offers";
import { formatINR } from "@/lib/site";

export { planMonths } from "@/lib/content/plans";
import { planBestFor, planIncludes, planMonths } from "@/lib/content/plans";

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

  return (
    <>
      {hasCouple && (
        <div className="mb-6 flex justify-center">
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
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${mode === o.v ? "bg-brand-strong text-white shadow-lg" : "text-white/70 hover:text-white"}`}
              >
                <o.icon className="h-4 w-4" /> {o.l}
              </button>
            ))}
          </div>
        </div>
      )}
      {!couple && plans.some((p) => p.offer) && (
        <p className="mx-auto mb-4 w-fit rounded-full bg-amber-400/15 px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wider text-amber-300">
          {plans.find((p) => p.offer)?.offer?.title} · prices below already include it
        </p>
      )}
      {/* One row per plan: what you get, who it suits, the price and one button. Perks show only what a
          plan adds over the one below it, so nothing is read twice. */}
      <ul className="mx-auto grid max-w-4xl gap-3">
        {visible.map((p) => {
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
          const { parent, adds } = planIncludes(p);
          return (
            <li
              key={p.id}
              className={`grid gap-4 rounded-2xl p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 ${p.featured ? "bg-gradient-to-br from-navy/70 to-coal ring-2 ring-brand" : "glass"}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl text-white sm:text-2xl">{p.name}</h3>
                  {p.featured && <span className="rounded-full bg-brand-strong px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Most popular</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-white/80">
                  {offer ? offer.gets : duration}
                  {couple && " · for 2 people"}
                  <span className="font-normal text-white/50"> · {planBestFor({ ...p, duration })}</span>
                </p>
                <p className="mt-2 flex gap-2 text-sm text-white/65">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    {parent && <>Everything in {parent}, plus </>}
                    {(parent ? adds.map((a, i) => (i ? a : a.charAt(0).toLowerCase() + a.slice(1))) : adds).join(" · ")}
                  </span>
                </p>
              </div>
              <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                <div className="sm:text-right">
                  {(saveRupees > 0 || save > 0) && (
                    <p className="text-xs">
                      {saveRupees > 0 && <span className="mr-1.5 text-white/40 line-through">{formatINR(p.originalPrice)}</span>}
                      <span className="font-bold text-emerald-300">Save {saveRupees > 0 ? formatINR(saveRupees) : `${save}%`}</span>
                    </p>
                  )}
                  <p className="font-display text-3xl text-white">{formatINR(price)}</p>
                  <p className="text-xs text-white/55">
                    ≈ {formatINR(perMonth)} / month{couple && ` · ${formatINR(perPerson)} each`}
                  </p>
                </div>
                <Link
                  href={payOnline ? `/join?plan=${encodeURIComponent(p.id)}${couple ? "&couple=1" : ""}` : "/contact#trial"}
                  aria-label={`Join ${p.name}${couple ? " (couple)" : ""}`}
                  className={`shrink-0 rounded-full px-6 py-2.5 text-center text-sm font-bold ${p.featured ? "btn-brand" : "border border-brand/50 text-brand hover:bg-brand hover:text-white"}`}
                >
                  Join
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
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
