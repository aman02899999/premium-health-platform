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


export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const from = Math.min(...applyOffer(c.plans, todayIST()).map((p) => p.price));
  return pageMeta(c, {
    title: "Gym Membership Fees in Sector 93 Noida — Single & Couple Plans",
    description: `${c.business.name} gym membership from ${formatINR(from)}/month. Single and couple plans for 1, 3, 6, 12 and 15 months with trainer guidance and diet charts.`,
    path: "/membership",
  });
}

export default async function MembershipPage() {
  const c = await getContent();
  const plans = applyOffer(c.plans, todayIST());
  const policy = planFaqs(c.business);
  const faqs = c.faqs.filter((f) => ["couple", "trial", "diet", "beginner", "timings"].includes(f.id));
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Membership", path: "/membership" }]), faqJsonLd([...policy, ...faqs])]} />
      <PageHero eyebrow="Membership" title="Invest in" highlight="yourself" intro="Transparent single and couple pricing, and a free trial before you commit." />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="sr-only">Membership plans and prices</h2>
        <PlanGrid plans={plans} note={c.planNote} payOnline={razorpayConfigured()} />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="Compare" title="Every plan," highlight="side by side" intro="Prices, cost per month and what each plan includes." />
        <PlanMatrix plans={plans} />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/membership/price-sheet" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand">
            <Printer className="h-4 w-4" /> Printable price sheet
          </Link>
          <a href="/api/membership/plans-pdf" className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
            <FileDown className="h-4 w-4" /> Download plans &amp; terms (PDF)
          </a>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="In plain words" title="Which plan" highlight="fits you" />
        <PlanSummaries plans={plans} />
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
