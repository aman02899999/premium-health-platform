"use client";

import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, collectionPageJsonLd } from "@/lib/seo";

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const json = breadcrumbJsonLd(items);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export function FAQJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (!faqs?.length) return null;
  const json = faqJsonLd(faqs);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export function ItemListJsonLd({ items }: { items: { name: string; path: string; image?: string }[] }) {
  const json = itemListJsonLd(items);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export function CollectionJsonLd({ title, description, slug, items }: { title: string; description: string; slug: string; items: { name: string; path: string }[] }) {
  const json = collectionPageJsonLd({ title, description, slug, items });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
