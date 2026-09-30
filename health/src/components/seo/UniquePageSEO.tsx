"use client";

import { breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/lib/seo";

type BreadcrumbA = { name: string; path: string };
type BreadcrumbB = { name: string; item: string };

export function UniquePageSEO(props: {
  title?: string;
  description?: string;
  path?: string;
  breadcrumbs?: (BreadcrumbA | BreadcrumbB)[];
  faqs?: { q: string; a: string }[];
  howTo?: { name: string; description?: string; steps: (string | { name: string; text: string })[] };
}) {
  const breadcrumbs = props.breadcrumbs ?? [];
  // normalize to {name,path} for lib
  const normalized = breadcrumbs.map((b: any) => ({
    name: b.name,
    path: b.path ?? b.item ?? "/",
  }));
  const breadcrumbLd = normalized.length ? breadcrumbJsonLd(normalized as any) : null;
  const faqLd = props.faqs ? faqJsonLd(props.faqs) : null;

  let howToLd: any = null;
  if (props.howTo) {
    const steps = props.howTo.steps.map((s: any) => (typeof s === "string" ? { name: s, text: s } : s));
    howToLd = howToJsonLd({
      name: props.howTo.name,
      description: props.howTo.description ?? props.howTo.name,
      steps,
    } as any);
  }

  return (
    <>
      {breadcrumbLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      {howToLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />}
    </>
  );
}
