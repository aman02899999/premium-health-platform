import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChefHat, FileText, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { isDbConfigured } from "@/health/db";
import { whatsappHref } from "@/lib/site";
import { DIET_CHART } from "@/lib/growth/config";
import { PageHero } from "@/components/ui/Section";
import { DietChartCheckout } from "@/components/diet-chart/DietChartCheckout";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Personal Indian Diet Chart by a Coach",
    description: `A 7-day Indian diet chart made for you by a ${c.business.name} coach: your calories and protein, your regional food, in katori and roti measures. PDF on WhatsApp within ${DIET_CHART.turnaround}.`,
    path: "/diet-chart",
  });
}

const FEATURES = [
  { icon: Scale, title: "Your numbers", text: "Calories and protein worked out from your age, height, weight, activity and goal using standard formulas (Mifflin-St Jeor, ICMR-NIN 2020)." },
  { icon: ChefHat, title: "Your kind of food", text: "North, South, West or East Indian dishes; veg, egg, non-veg, vegan or Jain. Food values from the Indian Food Composition Tables (IFCT 2017)." },
  { icon: CalendarClock, title: "Easy to follow", text: "Meal times from your wake-up time, and portions in katori, roti, glass and teaspoon — no kitchen scale needed." },
  { icon: FileText, title: "Branded 7-day PDF", text: "A week-at-a-glance chart for the fridge, plus a page per day with every meal." },
  { icon: MessageCircle, title: "Checked by a coach", text: "Every chart is reviewed by a coach before it is sent. Health conditions you mention are taken into account." },
];

export default async function DietChartPage() {
  const c = await getContent();
  const b = c.business;
  const live = razorpayConfigured() && isDbConfigured;
  return (
    <>
      <PageHero eyebrow="Personal diet chart" title="Your diet chart," highlight="made for you" intro={`A 7-day Indian diet chart made by our coaches for your body, your goal and your food habits. ₹${DIET_CHART.priceRupees.toLocaleString("en-IN")}, delivered on WhatsApp within ${DIET_CHART.turnaround}.`} />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pt-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5">
            <f.icon className="h-6 w-6 text-brand" />
            <h2 className="mt-3 font-display text-lg text-white">{f.title}</h2>
            <p className="mt-1 text-sm text-white/60">{f.text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {live ? (
          <DietChartCheckout price={DIET_CHART.priceRupees} turnaround={DIET_CHART.turnaround} gymName={b.name} whatsapp={b.whatsapp} />
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
