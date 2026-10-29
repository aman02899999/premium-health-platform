import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { formatINR } from "@/lib/site";
import { FaqList } from "@/components/home/Blocks";
import { PlanGrid } from "@/components/home/PlanGrid";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { PersonalTraining } from "@/components/home/PersonalTraining";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import Link from "next/link";
import { FileDown, Printer } from "lucide-react";
import { PlanMatrix, PlanSummaries } from "@/components/membership/PlanCompare";
import { planFaqs } from "@/lib/content/plans";


export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const from = Math.min(...applyOffer(c.plans, todayIST(), c.offers).map((p) => p.price));
  return pageMeta(c, {
    title: "Gym Membership Fees in Sector 93 Noida — Single & Couple Plans",
    description: `${c.business.name} gym membership from ${formatINR(from)}/month. Single and couple plans for 1, 3, 6, 12 and 15 months with trainer guidance and diet charts.`,
    path: "/membership",
  });
}

export default async function MembershipPage() {
  const c = await getContent();
  const plans = applyOffer(c.plans, todayIST(), c.offers);
  const policy = planFaqs(c.business);
  const faqs = c.faqs.filter((f) => ["couple", "trial", "diet", "beginner", "timings"].includes(f.id));
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Membership", path: "/membership" }]), faqJsonLd([...policy, ...faqs])]} />
      <PageHero eyebrow="Membership" title="Pick your" highlight="plan" intro="Every plan and price in one list. Not sure yet? Your first session is free." />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="sr-only">Membership plans and prices</h2>
        <PlanGrid plans={plans} note={c.planNote} payOnline={razorpayConfigured()} />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/contact#trial" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand">
            Book a free trial first
          </Link>
          <a href="/api/membership/plans-pdf" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand">
            <FileDown className="h-4 w-4" /> Plans &amp; terms (PDF)
          </a>
        </div>
      </section>
      {/* The detail stays one tap away instead of filling five more screens on a phone. */}
      <section className="mx-auto max-w-5xl space-y-3 px-4 pb-12 sm:px-6">
        <details className="glass group rounded-2xl px-5 py-4 open:ring-1 open:ring-brand/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
            Compare every plan side by side
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/50 text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4">
            <PlanMatrix plans={plans} />
            <p className="mt-4 text-center text-sm">
              <Link href="/membership/price-sheet" className="inline-flex items-center gap-2 text-white/70 underline hover:text-brand">
                <Printer className="h-4 w-4" /> Printable price sheet
              </Link>
            </p>
          </div>
        </details>
        <details className="glass group rounded-2xl px-5 py-4 open:ring-1 open:ring-brand/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
            Which plan fits me? (in plain words)
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/50 text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4">
            <PlanSummaries plans={plans} />
          </div>
        </details>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="Plan rules" title="Usage, cancellation" highlight="& freeze" intro={<>The short version of our <Link href="/refund-policy" className="underline hover:text-brand">Refund &amp; Cancellation Policy</Link>.</>} />
        <FaqList faqs={policy} />
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <SectionHeading eyebrow="Personal training" title="Train 1:1 with" highlight="Aman Sharma" intro="Head coach with 15+ years of experience. A plan built around your goal, and a coach at your side every session." />
        <PersonalTraining business={c.business} />
      </section>
      {faqs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Before you join" title="Common" highlight="questions" />
          <FaqList faqs={faqs} />
        </section>
      )}
    </>
  );
}
