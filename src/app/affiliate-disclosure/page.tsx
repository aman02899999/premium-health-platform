import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Affiliate Disclosure", description: "How affiliate links work on Bharat Health Guide: clearly labelled, never influencing evidence ratings or editorial content." };

export default function AffiliatePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Affiliate Disclosure" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Affiliate Disclosure</h1>
      <div className="mt-4 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
        <p>{SITE.affiliateDisclosure}</p>
        <p><strong>How it works:</strong> Product pages show merchant, price placeholder, rating placeholder and a CTA (View Product / Check Price / Learn More). Links resolve via configurable affiliate URLs stored in the database — never hardcoded in components.</p>
        <p><strong>Editorial independence:</strong> Evidence badges, safety warnings and “limitations” sections are written before any monetisation. Negative findings are never hidden to protect a sale.</p>
        <p><strong>Current status:</strong> All products are clearly marked <em>Demo</em> with placeholder prices until real merchant integrations are configured.</p>
      </div>
    </div>
  );
}
