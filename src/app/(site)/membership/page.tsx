import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { formatINR } from "@/lib/site";
import { FaqList, PlanGrid } from "@/components/home/Blocks";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const from = Math.min(...c.plans.map((p) => p.price));
  return pageMeta(c, {
    title: "Gym Membership Fees in Sector 93 Noida",
    description: `${c.business.name} membership plans from ${formatINR(from)}. Monthly, quarterly, half-yearly and annual gym plans with trainer guidance and diet charts.`,
    path: "/membership",
  });
}

export default async function MembershipPage() {
  const c = await getContent();
  const faqs = c.faqs.filter((f) => ["trial", "diet", "beginner", "timings"].includes(f.id));
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Membership", path: "/membership" }]), faqJsonLd(faqs)]} />
      <PageHero eyebrow="Membership" title="Invest in" highlight="yourself" intro="Transparent pricing, flexible freezes and a free trial before you commit." />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <PlanGrid plans={c.plans} note={c.planNote} />
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
