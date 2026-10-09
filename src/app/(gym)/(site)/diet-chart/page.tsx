import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChefHat, FileText, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { isDbConfigured } from "@/health/db";
import { whatsappHref } from "@/lib/site";
import { DIET_CHART, DIET_PLANS } from "@/lib/growth/config";
import { autoSendMode, type AutoSend } from "@/lib/growth/auto-send";
import { PageHero } from "@/components/ui/Section";
import { DietChartCheckout } from "@/components/diet-chart/DietChartCheckout";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Personal Indian Diet & Fitness Plan by a Coach",
    description: `A personal Indian diet and workout plan made for your body by a ${c.business.name} coach: your calories and protein, your regional food, in katori and roti measures. Plans from ₹${DIET_PLANS[0].priceRupees.toLocaleString("en-IN")}; PDF on WhatsApp and email within ${DIET_CHART.turnaround}.`,
    path: "/diet-chart",
  });
}

const FEATURES = [
  { icon: Scale, title: "Your numbers", text: "Calories and protein worked out from your age, height, weight, activity and goal using standard formulas (Mifflin-St Jeor, ICMR-NIN 2020)." },
  { icon: ChefHat, title: "Your kind of food", text: "North, South, West or East Indian dishes; veg, egg, non-veg, vegan or Jain. Food values from the Indian Food Composition Tables (IFCT 2017)." },
  { icon: CalendarClock, title: "Easy to follow", text: "Meal times from your wake-up time, and portions in katori, roti, glass and teaspoon — no kitchen scale needed." },
  { icon: FileText, title: "Branded plan PDF", text: "A week-at-a-glance chart for the fridge, a page per day, your workouts, grocery list and 12-week roadmap — on WhatsApp and email." },
];
// Honest about review: with auto-send on, only some plans are seen by the coach before they go out.
const reviewFeature = (mode: AutoSend) => ({
  icon: MessageCircle,
  title: "Checked by a coach",
  text:
    mode === "off"
      ? "Every plan is reviewed by a coach before it is sent. Health conditions and medicines you mention are taken into account."
      : mode === "no-conditions"
        ? "Plans for anyone with a health condition or medicines are reviewed by a coach before they are sent."
        : "Health conditions you mention are taken into account; message your coach any time with questions.",
});

export default async function DietChartPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const c = await getContent();
  const b = c.business;
  const live = razorpayConfigured() && isDbConfigured;
  return (
    <>
      <PageHero eyebrow="Personal diet chart" title="Your diet chart," highlight="made for you" intro={`A personal Indian diet and workout plan for your body, your goal and your food habits — updated every 2 weeks on 3-month plans. From ₹${DIET_PLANS[0].priceRupees.toLocaleString("en-IN")}, delivered on WhatsApp and email within ${DIET_CHART.turnaround}.`} />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pt-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {[...FEATURES, reviewFeature(autoSendMode())].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5">
            <f.icon className="h-6 w-6 text-brand" />
            <h2 className="mt-3 font-display text-lg text-white">{f.title}</h2>
            <p className="mt-1 text-sm text-white/60">{f.text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {live ? (
          <DietChartCheckout turnaround={DIET_CHART.turnaround} gymName={b.name} whatsapp={b.whatsapp} initialPlan={plan} />
        ) : (
          <div className="glass brand-border space-y-4 rounded-3xl p-8 text-center">
            <p className="text-white/80">Online ordering is being set up. Message us on WhatsApp to order your personal diet chart.</p>
            <a href={whatsappHref(b, `Hi ${b.name}, I'd like a personal diet chart.`)} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
              WhatsApp us
            </a>
          </div>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/45">
          <ShieldCheck className="h-4 w-4" /> Payments by Razorpay. Not a substitute for medical advice. Want free plans first? See our <Link href="/diet-plans" className="underline">sample diet plans</Link>.
        </p>
      </section>
    </>
  );
}
