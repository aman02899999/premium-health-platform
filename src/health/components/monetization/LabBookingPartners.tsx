"use client";

import { ExternalLink, Home } from "lucide-react";
import type { LabPartner } from "@/health/lib/monetization/lab-partners";
import { trackAffiliateClick } from "@/health/components/marketing/Analytics";

/**
 * "Book this test with a home sample" box with the owner's lab affiliate links. Renders nothing
 * until at least one link is set. Kept outside warnings, FAQs and tables (YMYL and ad rules).
 */
export function LabBookingPartners({ partners, testName, page }: { partners: LabPartner[]; testName?: string; page: string }) {
  if (partners.length === 0) return null;
  return (
    <section aria-labelledby="lab-book" className="rounded-3xl border border-cyan-200 bg-cyan-50/60 p-5 dark:border-cyan-900 dark:bg-cyan-950/30">
      <h2 id="lab-book" className="font-display flex items-center gap-2 text-xl font-bold">
        <Home className="h-5 w-5 text-cyan-700 dark:text-cyan-400" /> {testName ? `Book ${testName} with a home sample` : "Book a lab test with a home sample"}
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">If your doctor has asked for this test, these labs collect the sample at home. Prices and reports are from the lab.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {partners.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="sponsored nofollow noopener"
            onClick={() => trackAffiliateClick(p.id, p.name, page)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-900"
          >
            {p.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">Affiliate links: we may earn a commission at no extra cost to you. Any accredited lab your doctor trusts is equally fine.</p>
    </section>
  );
}
