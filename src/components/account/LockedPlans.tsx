import Link from "next/link";
import { CalendarClock, Dumbbell, FileDown, HeartPulse, Lock, RefreshCw, Salad } from "lucide-react";
import { DIET_PLANS } from "@/lib/growth/config";
import { packageRules } from "@/lib/growth/entitlement";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const FEATURES = [
  { icon: Salad, title: "Personal Indian diet chart", text: "Calories and protein from your own body numbers, in katori, roti and spoon measures." },
  { icon: Dumbbell, title: "Matching workout week", text: "Gym or home, set to your training days, with pre- and post-workout meals." },
  { icon: RefreshCw, title: "Plans that update as you change", text: "Enter today's weight and waist; your next plan is rebuilt around them." },
  { icon: HeartPulse, title: "Health-aware", text: "Diabetes, thyroid, PCOS, BP and more: your coach checks those plans before they reach you." },
  { icon: FileDown, title: "Every plan saved here", text: "Download any plan again, any time, as a PDF." },
  { icon: CalendarClock, title: "Reminders on WhatsApp", text: "We tell you when your next update is due." },
];

/** What a paid plan unlocks, shown before payment: features visible, the plan itself locked. */
export function LockedPlans() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
        <div aria-hidden className="pointer-events-none select-none space-y-2 bg-white/[.03] p-5 blur-[6px]">
          {["Breakfast · Poha + curd · 380 kcal · 18 g protein", "Lunch · 2 roti, dal, paneer sabzi · 560 kcal", "Pre-workout · Banana + black coffee", "Dinner · Grilled chicken / tofu, salad · 450 kcal", "Day 1 · Push · Bench 4×8 · OHP 3×10 · Dips 3×12"].map((l) => (
            <p key={l} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">{l}</p>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/60 p-6 text-center">
          <Lock className="h-7 w-7 text-brand" />
          <p className="font-display text-xl text-white">Your plan unlocks after payment</p>
          <Link href="/diet-chart?plan=trial#order" className="btn-brand rounded-full px-6 py-2.5 text-sm font-bold">
            Try 7 days for ₹49
          </Link>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
            <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span>
              <span className="block font-semibold text-white">{f.title}</span>
              <span className="text-sm text-white/60">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-2.5">Package</th>
              <th className="px-4 py-2.5">Plans included</th>
              <th className="px-4 py-2.5 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {DIET_PLANS.map((p) => {
              const r = packageRules(p.id);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 text-white">
                    <Link href={`/diet-chart?plan=${p.id}#order`} className="hover:text-brand">{p.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-white/70">{r.everyDays ? `${r.included} · a new one every ${r.everyDays} days` : "1"}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-white">{inr(p.priceRupees)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
