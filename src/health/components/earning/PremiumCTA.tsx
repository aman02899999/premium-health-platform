"use client";

import Link from "next/link";
import { Crown, Check, Zap } from "lucide-react";
import { useAuth } from "@/health/components/auth/AuthContext";
import { DIET_PLANS } from "@/lib/growth/config";

// "Premium" on the health site is Royal Fitness Club's personal coaching: a ₹49 trial and full plans.
const trial = DIET_PLANS.find((p) => p.trial)!;
const trialHref = (medium: string) => `/diet-chart?plan=trial&utm_source=health&utm_medium=${medium}&utm_campaign=premium#order`;

export function PremiumCTA({ compact }: { compact?: boolean }) {
  const { user, isPremium } = useAuth();

  if (isPremium) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-700 dark:from-amber-950/40">
        <p className="flex items-center gap-2 text-sm font-bold"><Crown className="h-4 w-4 text-amber-700 dark:text-amber-600" /> Premium Active</p>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Thanks, {user?.name}! You have ad-free + meal plans + priority Q&A.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-emerald-900 p-4 text-white">
        <p className="flex items-center gap-2 text-sm font-bold"><Crown className="h-4 w-4 text-amber-400" /> Your own diet plan · ₹{trial.priceRupees}</p>
        <p className="mt-1 text-xs text-emerald-100/80">A 7-day Indian diet and workout plan made for your body by Royal Fitness Club&apos;s certified nutritionist.</p>
        <div className="mt-3 flex gap-2">
          <Link href={trialHref("cta_compact")} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">Try 7 days</Link>
          <Link href="/health/premium" className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold">All plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 p-6 text-white">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300"><Crown className="h-4 w-4" /> Premium · Royal Fitness Club</p>
      <h3 className="mt-2 font-display text-2xl font-black">Get a plan made for your body</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-emerald-100/90">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Calories and protein from your body numbers</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Indian diet chart in katori and roti measures</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Workout week matched to your diet</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Made by a certified nutritionist, 15+ years coaching</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={trialHref("cta")} className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400"><Zap className="h-4 w-4" /> Try 7 days for ₹{trial.priceRupees}</Link>
        <Link href="/health/premium" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/10">See all plans</Link>
      </div>
    </div>
  );
}

export function EarningStats() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Affiliate clicks (this browser)</p>
        <p className="mt-1 text-2xl font-black" id="aff-clicks">—</p>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">Tracked via localStorage + gtag</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Premium Users</p>
        <p className="mt-1 text-2xl font-black">0</p>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">Premium not launched — no payments taken</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Ad &amp; affiliate revenue</p>
        <p className="mt-1 text-2xl font-black">—</p>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">See your AdSense and Amazon Associates dashboards</p>
      </div>
    </div>
  );
}
