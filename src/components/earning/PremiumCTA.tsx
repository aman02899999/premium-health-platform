"use client";

import Link from "next/link";
import { Crown, Check, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export function PremiumCTA({ compact }: { compact?: boolean }) {
  const { user, isPremium, upgradeToPremium } = useAuth();

  if (isPremium) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-700 dark:from-amber-950/40">
        <p className="flex items-center gap-2 text-sm font-bold"><Crown className="h-4 w-4 text-amber-600" /> Premium Active</p>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Thanks, {user?.name}! You have ad-free + meal plans + priority Q&A.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-emerald-900 p-4 text-white">
        <p className="flex items-center gap-2 text-sm font-bold"><Crown className="h-4 w-4 text-amber-400" /> Go Premium — ₹199/mo</p>
        <p className="mt-1 text-xs text-emerald-100/80">Ad-free, thali plans, millet swaps, herb-drug checker unlimited.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/premium" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900">View Plans</Link>
          <button onClick={upgradeToPremium} className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold">Demo Upgrade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 p-6 text-white">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300"><Crown className="h-4 w-4" /> Premium — Earning Platform</p>
      <h3 className="mt-2 font-display text-2xl font-black">Unlock Pro — Ad-free + Personalized</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-emerald-100/90">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Unlimited thali builder + millet swap + dosha meals</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Herb-drug checker unlimited + fasting planner</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Ad-free reading + priority health Q&A</li>
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Weekly meal PDF + WhatsApp tips</li>
      </ul>
      <div className="mt-4 flex gap-2">
        <Link href="/premium" className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400"><Zap className="h-4 w-4" /> Go Premium ₹199/mo</Link>
        <button onClick={upgradeToPremium} className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/10">Demo: Activate Premium</button>
      </div>
      <p className="mt-2 text-[11px] text-stone-400">Demo mode — no payment. In prod: Razorpay/UPI integration.</p>
    </div>
  );
}

export function EarningStats() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Affiliate Clicks (demo)</p>
        <p className="mt-1 text-2xl font-black" id="aff-clicks">—</p>
        <p className="text-[11px] text-stone-400">Tracked via localStorage + gtag</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Premium Users</p>
        <p className="mt-1 text-2xl font-black">1,247</p>
        <p className="text-[11px] text-emerald-600">+12% this month (demo)</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-xs font-bold uppercase text-stone-500">Ad Revenue (est.)</p>
        <p className="mt-1 text-2xl font-black">₹42,300</p>
        <p className="text-[11px] text-stone-400">AdSense + affiliate (demo)</p>
      </div>
    </div>
  );
}
