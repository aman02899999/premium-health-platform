"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import type { OfferPlan } from "@/lib/offers";
import { formatINR } from "@/lib/site";
import { planBestFor, planMonths } from "@/lib/content/plans";
import { recommendPlan, restrictedPlans, type FinderGoal, type FinderWho } from "@/lib/content/plan-finder";

const GOALS: { v: FinderGoal; l: string }[] = [
  { v: "try", l: "Try the gym first" },
  { v: "three", l: "Lose fat or get stronger in 3 months" },
  { v: "six", l: "Change my shape in 6 months" },
  { v: "year", l: "Train all year at the lowest monthly cost" },
];

const chip = (on: boolean) =>
  `rounded-full px-4 py-2.5 text-left text-sm font-semibold transition-colors ${on ? "bg-brand-strong text-white" : "border border-white/15 text-white/75 hover:border-brand/60 hover:text-white"}`;

/** Two taps to a plan suggestion, picked from the same plans the list below shows. */
export function PlanFinder({ plans, payOnline = false }: { plans: OfferPlan[]; payOnline?: boolean }) {
  const hasCouple = plans.some((p) => p.couplePrice > 0);
  const [who, setWho] = useState<FinderWho>("single");
  const [goal, setGoal] = useState<FinderGoal | null>(null);
  const couple = who === "couple" && hasCouple;
  const pick = goal ? recommendPlan(plans, couple ? "couple" : "single", goal) : undefined;
  const special = couple ? [] : restrictedPlans(plans);

  // Couples pay standard prices for the standard length (offers are for single memberships).
  const duration = pick ? (couple ? (pick.offer?.standardDuration ?? pick.duration) : pick.duration) : "";
  const price = pick ? (couple ? pick.couplePrice : pick.price) : 0;

  return (
    <div className="glass mx-auto mb-8 max-w-4xl rounded-2xl p-5 sm:p-6">
      <h3 className="flex items-center gap-2 font-display text-xl text-white">
        <Compass className="h-5 w-5 text-brand" /> Not sure which plan? Two taps.
      </h3>
      {hasCouple && (
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-white/50">Who is joining?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={who === "single"} onClick={() => setWho("single")} className={chip(who === "single")}>
              Just me
            </button>
            <button type="button" aria-pressed={who === "couple"} onClick={() => setWho("couple")} className={chip(who === "couple")}>
              Two of us together
            </button>
          </div>
        </fieldset>
      )}
      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-white/50">What do you want?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.v} type="button" aria-pressed={goal === g.v} onClick={() => setGoal(g.v)} className={chip(goal === g.v)}>
              {g.l}
            </button>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite">
        {goal && !pick && <p className="mt-5 text-sm text-white/70">Call or WhatsApp us and we&apos;ll suggest a plan.</p>}
        {pick && (
          <div className="mt-5 grid gap-4 rounded-xl bg-black/30 p-4 ring-1 ring-brand/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Our suggestion</p>
              <p className="mt-1 font-display text-2xl text-white">
                {pick.name} · {formatINR(price)}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {/* An offer's own line already states what you get and the monthly cost. */}
                {!couple && pick.offer ? pick.offer.gets : `${duration}${couple ? " for 2 people" : ""} · about ${formatINR(Math.round(price / planMonths(duration)))} a month${couple ? `, ${formatINR(Math.round(price / 2))} each` : ""}`}
                {" · "}
                {planBestFor({ ...pick, duration })}
              </p>
              {special.length > 0 && (
                <p className="mt-2 text-xs text-white/55">
                  Also on the list: {special.map((p) => `${p.name} (${formatINR(p.price)})`).join(", ")}.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col">
              <Link href="/contact#trial" className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
                Free trial first <ArrowRight className="h-4 w-4" />
              </Link>
              {payOnline && (
                <Link
                  href={`/join?plan=${encodeURIComponent(pick.id)}${couple ? "&couple=1" : ""}`}
                  className="inline-flex items-center justify-center rounded-full border border-brand/50 px-5 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-white"
                >
                  Join {pick.name}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
