import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, EvidenceBadge } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Editorial Policy, Evidence & Medical Review",
  description: "Who we are, how we write, how we grade evidence, and our medical-review workflow for a trustworthy Indian health publication.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="font-display mt-3 text-3xl font-black md:text-4xl">About {SITE.name}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{SITE.tagline}. We are building a scalable Indian health-media platform — 1,000+ articles eventually — that respects both modern medicine and Indian tradition without confusing the two.</p>
      <div className="prose-health mt-6 space-y-4 text-[15px] leading-relaxed">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">What we promise</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-200">
            <li>Responsible language: understand, manage, support, prevent — never “cure-all” claims.</li>
            <li>Clear separation of modern medicine, Ayurveda, homeopathy, herbs, nutrition and lifestyle.</li>
            <li>Every intervention labelled by evidence strength, with safety and interactions.</li>
            <li>No personalised doses, no stop-change advice, no fear marketing, no fake doctors or testimonials.</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["strong", "moderate", "limited", "mixed", "insufficient"] as const).map((l) => <EvidenceBadge key={l} level={l} />)}
          </div>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">Content workflow</h2>
          <p className="mt-2">Draft → Editorial review → Medical review → SEO review → Publish. Medically sensitive pages require approval before publication and carry author, reviewer, published and updated dates. Current reviewer slots show “Medical review pending — placeholder” until legitimate reviewers are assigned; we do not invent credentials.</p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-xl font-bold">Brand</h2>
          <p className="mt-2">“{SITE.name}” is a working brand stored in one config file (<code>src/lib/site.ts</code>) so it can be renamed without touching pages. The identity blends modern medical credibility with Indian editorial warmth — premium, not mystical.</p>
        </section>
      </div>
      <p className="mt-6 text-sm">Questions? <Link href="/contact" className="font-bold text-emerald-700 underline">Contact us</Link> · <Link href="/disclaimer" className="font-bold text-emerald-700 underline">Disclaimer</Link> · <Link href="/privacy" className="font-bold text-emerald-700 underline">Privacy</Link></p>
    </div>
  );
}
