import type { Metadata } from "next";
import DiseasesClient from "./DiseasesClient";
import { DISEASES, DISEASE_SYSTEMS, DISEASE_CATEGORIES } from "@/health/data/diseases-index";
import { SITE } from "@/health/lib/site";
import { diseaseIndexable } from "@/health/lib/content-quality";
import { approvedDiseaseSlugs } from "@/health/lib/disease-reviews";

const seoTitle = "Disease Guides — Indian Health Conditions Explained";
const seoDescription = "In-depth, sourced guides to common Indian health conditions: symptoms, causes, tests, treatment, diet and when to see a doctor.";
const url = "/health/diseases";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Disease guides")}&category=${encodeURIComponent("Diseases")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

// Hand-written guides plus drafts a doctor approved in Admin → Health page review. Template
// pages stay reachable by URL and related links (noindex) until each is rewritten or approved;
// see src/health/lib/content-quality.ts. Approvals refresh this page at once on the server that
// saved them (revalidatePath), and everywhere else within a day.
export const revalidate = 86400; // 1 day (see src/lib/isr-budget.test.ts)

export default async function DiseasesPage() {
  const approved = new Set(await approvedDiseaseSlugs());
  const guides = DISEASES.filter((d) => diseaseIndexable(d.slug) || approved.has(d.slug));
  return <DiseasesClient diseases={guides} systems={DISEASE_SYSTEMS} categories={DISEASE_CATEGORIES} />;
}
