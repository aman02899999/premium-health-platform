"use client";

import { breadcrumbJsonLd, faqJsonLd } from "@/health/lib/seo";

type BreadcrumbA = { name: string; path: string };
type BreadcrumbB = { name: string; item: string };

/**
 * Breadcrumb and FAQ markup for a page.
 *
 * Structured data must describe what a visitor can see. Most pages pass `faqs` that are never
 * shown on the page, and Google treats FAQ markup for hidden content as spammy structured data
 * (a manual-action risk). So FAQPage is emitted only when the page says it renders those same
 * FAQs (`faqsVisible`). `howTo` is accepted for older callers but not emitted: Google retired
 * HowTo rich results in 2023, and on these pages the steps were not shown either.
 */
export function UniquePageSEO(props: {
  title?: string;
  description?: string;
  path?: string;
  breadcrumbs?: (BreadcrumbA | BreadcrumbB)[];
  faqs?: { q: string; a: string }[];
  faqsVisible?: boolean;
  howTo?: { name: string; description?: string; steps: (string | { name: string; text: string })[] };
}) {
  const breadcrumbs = props.breadcrumbs ?? [];
  // normalize to {name,path} for lib
  const normalized = breadcrumbs.map((b) => ({
    name: b.name,
    path: "path" in b ? b.path : b.item ?? "/",
  }));
  const breadcrumbLd = normalized.length ? breadcrumbJsonLd(normalized) : null;
  const faqLd = props.faqsVisible && props.faqs?.length ? faqJsonLd(props.faqs) : null;

  return (
    <>
      {breadcrumbLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </>
  );
}
