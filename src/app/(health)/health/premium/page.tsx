import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, Dumbbell, MapPin, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Breadcrumbs } from "@/health/components/ui";
import { DIET_PLANS } from "@/lib/growth/config";
import { nurtureBusiness } from "@/lib/growth/daily";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Premium Coaching by Royal Fitness Club — Personal Diet & Training Plans",
  description: "Personal Indian diet and workout plans built on your body numbers by Royal Fitness Club's certified nutritionist. Try 7 days for ₹49, or train at the gym in Sector 93, Noida.",
  alternates: { canonical: "/health/premium" },
};

// Where the visit came from, so Growth → Leads and Razorpay notes show the health site sent it.
const utm = (medium: string) => `utm_source=health&utm_medium=${medium}&utm_campaign=premium`;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function PremiumPage() {
  const biz = await nurtureBusiness().catch(() => null);
  const trial = DIET_PLANS.find((p) => p.trial)!;
  const programmes = DIET_PLANS.filter((p) => p.months > 0);
  const wa = biz?.whatsapp || "918851830081";
  const coach = biz?.coach || "Coach Aman Sharma";
  const gym = biz?.name || "Royal Fitness Club";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Premium" }]} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-amber-900 p-8 text-white md:p-10">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300"><Crown className="h-4 w-4" /> Premium · by {gym}</p>
        <h1 className="font-display mt-2 text-4xl font-black md:text-5xl">Stop reading about health. Get a plan made for your body.</h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-100/90">
          The guides on this site are free and stay free. When you want results, {coach} (Certified Nutritionist, 15+ years coaching) builds an Indian diet and workout plan on your own numbers: calories, protein, health conditions, veg or non-veg, and the food your family already cooks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/diet-chart?plan=trial&${utm("hero")}#order`} className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400">
            <Zap className="h-4 w-4" /> Try 7 days for {inr(trial.priceRupees)}
          </Link>
          <Link href={`/diet-chart?plan=3m&${utm("hero")}#order`} className="rounded-2xl border border-white/25 px-6 py-3 text-sm font-bold hover:bg-white/10">
            See the 3-month plan
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-emerald-100/60">Delivered as a PDF on WhatsApp and email. One trial per person.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-950/30">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Start here</p>
            <h2 className="mt-1 text-xl font-black">{trial.name} · {inr(trial.priceRupees)}</h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {[
                "Your calories, protein, carbs and fat worked out from your body analysis",
                "A 7-day Indian diet chart in katori, roti and spoon measures",
                "A workout week matched to your diet",
                "Grocery list and a daily tracker",
                "A Day-7 review with your coach",
                "Built around your health conditions and food preference",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</li>
              ))}
            </ul>
            <Link href={`/diet-chart?plan=trial&${utm("trial_card")}#order`} className="mt-4 inline-flex rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-900">
              Start my 7-day trial
            </Link>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-lg font-black">Full coaching programmes</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">A fixed chart stops working once your weight changes. These plans are updated at every check-in, so they keep working.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {programmes.map((p) => (
                <Link
                  key={p.id}
                  href={`/diet-chart?plan=${p.id}&${utm("programme")}#order`}
                  className={`relative rounded-2xl border p-4 transition hover:-translate-y-0.5 ${p.popular ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : "border-stone-200 dark:border-stone-700"}`}
                >
                  {p.popular && <span className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-stone-900">Most popular</span>}
                  <p className="font-bold">{p.name}</p>
                  <p className="mt-1 text-2xl font-black">{inr(p.priceRupees)}</p>
                  <p className="text-[11px] text-stone-500">{inr(Math.round(p.priceRupees / (p.months * 30)))} a day · {p.checkIns} check-ins</p>
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">{p.summary}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-300"><MapPin className="h-4 w-4" /> In Noida? Train with us</p>
            <h2 className="mt-1 text-xl font-black">{gym}, Sector 93</h2>
            <p className="mt-2 text-sm text-white/75">
              AC gym with certified trainers, personal training and fat-loss and muscle-gain programmes.
              {biz?.membershipFrom ? ` Membership from ${inr(biz.membershipFrom)} a month.` : ""} Your first session is a free trial.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/membership?${utm("gym")}`} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-stone-900"><Dumbbell className="h-4 w-4" /> Membership plans</Link>
              <Link href={`/contact?${utm("gym")}`} className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold hover:bg-white/10">Book a free trial</Link>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi, I found you on the health site. I'd like to know about personal training.")}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/25 px-4 py-2 text-sm font-bold hover:bg-white/10">Ask about personal training</a>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Our promise</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">
              <li>Every calculator and guide on this site stays free</li>
              <li>Your plan is made by a person, not copied from a template</li>
              <li>Herbs and supplements are suggested only as support, never instead of your medicines</li>
              <li>Secure payment through Razorpay</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-amber-500" /> Not sure which plan?</h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Message {coach} on WhatsApp with your goal and we&apos;ll suggest the right one.</p>
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi, I'm on the health site. Which diet plan suits me?")}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Ask on WhatsApp</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
