import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import { aiFacts } from "@/lib/content/ai-facts";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { FaqList } from "@/components/home/Blocks";
import { CtaCard } from "@/components/blog/CtaCard";
import { SITE_URL, telHref, whatsappHref } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: `${c.business.name} FAQ — Gym in Sector 93 Noida: Fees, Timings, Trainers`,
    description: `Straight answers about ${c.business.name}, Sector 93 Noida: membership fees and current offer, timings, personal training, weight loss, women's training and how to choose a gym.`,
    path: "/faq",
  });
}

export default async function FaqPage() {
  const c = await getContent();
  const f = aiFacts(c, applyOffer(c.plans, todayIST()), SITE_URL);
  // The site's own FAQs follow, minus any that the answers above already cover.
  const extra = c.faqs.filter((x) => !["fees", "timings", "location"].includes(x.id));
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]), faqJsonLd([...f.faqs, ...extra])]} />
      <PageHero eyebrow="Questions and answers" title="Everything you'd ask" highlight="at the desk" intro={`Fees, timings, trainers and offers at ${c.business.name}, ${c.business.address.locality}, Noida. Prices on this page update with the plans.`} />
      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-12 sm:px-6">
        <FaqList faqs={[...f.faqs, ...extra]} />
        <p className="text-center text-sm text-white/60">
          Full plan comparison on the <Link href="/membership" className="underline hover:text-brand">membership page</Link> · programs on the <Link href="/programs" className="underline hover:text-brand">programs page</Link>
        </p>
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CtaCard whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
      </section>
    </>
  );
}
