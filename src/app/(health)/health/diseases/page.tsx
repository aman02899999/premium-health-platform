import type { Metadata } from "next";
import DiseasesClient from "./DiseasesClient";
import { DISEASES, DISEASE_SYSTEMS, DISEASE_CATEGORIES } from "@/health/data/diseases-index";
import { SITE } from "@/health/lib/site";
import { diseaseIndexable } from "@/health/lib/content-quality";

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

// Only the hand-written, sourced guides are listed. Template pages stay reachable by URL and
// related links (noindex) until each is rewritten; see src/health/lib/content-quality.ts.
const GUIDES = DISEASES.filter((d) => diseaseIndexable(d.slug));

export default function DiseasesPage() {
  return <DiseasesClient diseases={GUIDES} systems={DISEASE_SYSTEMS} categories={DISEASE_CATEGORIES} />;
}
