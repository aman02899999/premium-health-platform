"use client";

import { useEffect, useState } from "react";

type DayStat = { day: string; premium: number; affiliate: number; ads: number; leads: number; total: number };

const DEMO_WEEK: DayStat[] = [
  { day: "Mon", premium: 8200, affiliate: 1200, ads: 3100, leads: 1250, total: 13750 },
  { day: "Tue", premium: 9100, affiliate: 980, ads: 3400, leads: 1100, total: 14580 },
  { day: "Wed", premium: 8800, affiliate: 1500, ads: 2900, leads: 1750, total: 14950 },
  { day: "Thu", premium: 10200, affiliate: 2100, ads: 4200, leads: 2000, total: 18500 },
  { day: "Fri", premium: 11200, affiliate: 1800, ads: 3800, leads: 2250, total: 19050 },
  { day: "Sat", premium: 7600, affiliate: 2400, ads: 5100, leads: 1500, total: 16600 },
  { day: "Sun", premium: 6900, affiliate: 1100, ads: 2600, leads: 900, total: 11500 },
];

const REVENUE_BREAKDOWN = [
  { label: "Premium MRR", value: 248153, color: "bg-emerald-600", pct: 75 },
  { label: "Affiliate 8% (342 clicks)", value: 18400, color: "bg-amber-500", pct: 5.5 },
  { label: "AdSense 120k views", value: 42300, color: "bg-violet-600", pct: 12.8 },
  { label: "Lead Gen 89×₹250", value: 22250, color: "bg-sky-600", pct: 6.7 },
];

const UTM_DATA = [
  { src: "instagram / bio / summer-heat", users: 342, conv: 12, color: "bg-pink-500" },
  { src: "google / organic / diabetes-guide", users: 521, conv: 8, color: "bg-blue-500" },
  { src: "youtube / video / thali-builder", users: 198, conv: 15, color: "bg-red-500" },
  { src: "referral / user / viral-loop", users: 89, conv: 22, color: "bg-emerald-500" },
  { src: "whatsapp / broadcast / fasting", users: 267, conv: 18, color: "bg-green-500" },
  { src: "newsletter / weekly / millets", users: 412, conv: 10, color: "bg-amber-500" },
];

export function EarningCharts() {
  const [affClicks, setAffClicks] = useState<number>(0);
  const maxTotal = Math.max(...DEMO_WEEK.map((d) => d.total));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bhg-aff-clicks");
      if (raw) {
        const arr = JSON.parse(raw);
        setAffClicks(Array.isArray(arr) ? arr.length : 0);
      }
    } catch {}
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-800 dark:from-emerald-950/40">
          <p className="text-[11px] font-bold uppercase text-emerald-700">MRR (Demo)</p>
          <p className="mt-1 text-2xl font-black">₹2,48,153</p>
          <p className="text-[11px] text-emerald-700/70">1,247 × ₹199 · +12% MoM</p>
          <div className="mt-2 h-1.5 rounded-full bg-emerald-200"><div className="h-1.5 w-[75%] rounded-full bg-emerald-600" /></div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-[11px] font-bold uppercase text-amber-700">Affiliate (Demo)</p>
          <p className="mt-1 text-2xl font-black">₹18,400</p>
          <p className="text-[11px] text-amber-700/70">{affClicks} local clicks · 8% avg · Rs160-360/sale</p>
          <div className="mt-2 h-1.5 rounded-full bg-amber-200"><div className="h-1.5 w-[55%] rounded-full bg-amber-500" /></div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
          <p className="text-[11px] font-bold uppercase text-violet-700">Ads (Demo)</p>
          <p className="mt-1 text-2xl font-black">₹42,300</p>
          <p className="text-[11px] text-violet-700/70">120k views · ₹35 CPM · AdSense + affiliate</p>
          <div className="mt-2 h-1.5 rounded-full bg-violet-200"><div className="h-1.5 w-[65%] rounded-full bg-violet-600" /></div>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
          <p className="text-[11px] font-bold uppercase text-sky-700">Leads (Demo)</p>
          <p className="mt-1 text-2xl font-black">₹22,250</p>
          <p className="text-[11px] text-sky-700/70">89 leads × ₹250 avg · dietitian/lab/insurance</p>
          <div className="mt-2 h-1.5 rounded-full bg-sky-200"><div className="h-1.5 w-[60%] rounded-full bg-sky-600" /></div>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-bold">Revenue — Last 7 Days (Demo Bar Chart) — SEO + Earning Dashboard Pro</h3>
        <p className="mt-1 text-xs text-stone-500">Premium + Affiliate + Ads + Leads = Total · Hover for breakdown · Pro digital marketing analytics placeholder (GA4 + /api/earn/stats).</p>
        <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
          {DEMO_WEEK.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col-reverse gap-0.5" style={{ height: 120 }}>
                <div className="w-full rounded-t bg-emerald-600" title={`Premium ₹${d.premium}`} style={{ height: `${(d.premium / maxTotal) * 100}%` }} />
                <div className="w-full bg-amber-500" title={`Affiliate ₹${d.affiliate}`} style={{ height: `${(d.affiliate / maxTotal) * 60}%` }} />
                <div className="w-full bg-violet-600" title={`Ads ₹${d.ads}`} style={{ height: `${(d.ads / maxTotal) * 80}%` }} />
                <div className="w-full rounded-t bg-sky-600" title={`Leads ₹${d.leads}`} style={{ height: `${(d.leads / maxTotal) * 50}%` }} />
              </div>
              <span className="text-[11px] font-bold">{d.day}</span>
              <span className="text-[10px] text-stone-500">₹{(d.total / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Premium</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Affiliate</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-600" /> Ads</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-600" /> Leads</span>
        </div>
      </div>

      {/* Revenue breakdown horizontal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <h3 className="text-sm font-bold">Revenue Breakdown — Last 30 Days (Demo) — Stacked Bar</h3>
          <div className="mt-4 space-y-3">
            {REVENUE_BREAKDOWN.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs"><span>{r.label}</span><span className="font-bold">₹{r.value.toLocaleString("en-IN")} · {r.pct}%</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-stone-100 dark:bg-stone-800"><div className={`h-2.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
              </div>
            ))}
            <div className="flex justify-between border-t pt-3 text-sm font-black"><span>Total</span><span>₹3,31,103</span></div>
          </div>
          <p className="mt-3 text-[11px] text-stone-500">In prod: /api/earn/stats + Razorpay webhook /api/webhooks/razorpay + gtag purchase + /api/affiliate/stats + AdSense API + /api/lead stats.</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
          <h3 className="text-sm font-bold">UTM Sources — Top (Digital Marketing) — Bar + Conv%</h3>
          <div className="mt-4 space-y-3">
            {UTM_DATA.map((u) => (
              <div key={u.src}>
                <div className="flex justify-between text-[11px]"><span className="truncate pr-2 font-mono">{u.src}</span><span className="font-bold">{u.users} users · {u.conv}% conv</span></div>
                <div className="mt-1 flex gap-1">
                  <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 flex-1"><div className={`h-2 rounded-full ${u.color}`} style={{ width: `${Math.min(100, (u.users / 521) * 100)}%` }} /></div>
                  <div className="h-2 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${u.conv * 4}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-stone-500">Best conv: referral viral loop 22% — /api/referral + WhatsApp 40% open + Push 30% open. Tracked via UTMTracker + localStorage bhg-utm + gtag + /api/earn/stats.</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-bold">Conversion Funnel — Visitor → Lead → Premium (Demo) — Marketing Optimized</h3>
        <div className="mt-4 flex items-center gap-2">
          {[
            { label: "Visitors 10k", w: "100%", c: "bg-stone-800" },
            { label: "Newsletter 1.2k (12%)", w: "72%", c: "bg-sky-600" },
            { label: "Lead 320 (3.2%)", w: "45%", c: "bg-amber-500" },
            { label: "Premium 1247 MRR", w: "30%", c: "bg-emerald-600" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1 flex-1">
              <div className={`h-10 w-full rounded-xl ${f.c} flex items-center justify-center text-[10px] font-bold text-white`} style={{ width: f.w }}>{f.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-stone-500">Optimized via ExitIntent + StickyCTA + NewsletterPopup + WhatsAppOptIn + PushPrompt + Referral viral loop + LeadGen component + PremiumCTA + AffiliateProducts.</p>
      </div>
    </div>
  );
}
