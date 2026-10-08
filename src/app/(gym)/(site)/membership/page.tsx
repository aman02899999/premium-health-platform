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
  const faqs = c.faqs.filter((f) => ["couple", "trial", "diet", "beginner", "timings"].includes(f.id));
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Membership", path: "/membership" }]), faqJsonLd(faqs)]} />
      <PageHero eyebrow="Membership" title="Invest in" highlight="yourself" intro="Transparent single and couple pricing, and a free trial before you commit." />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <PlanGrid plans={applyOffer(c.plans, todayIST())} note={c.planNote} payOnline={razorpayConfigured()} />
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
