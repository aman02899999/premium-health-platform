import type { Metadata } from "next";
import DiseasesClient from "./DiseasesClient";
import { DISEASES, DISEASE_SYSTEMS, DISEASE_CATEGORIES } from "@/data/diseases-index";
import { SITE } from "@/lib/site";

const seoTitle = "Disease Directory — 120+ Conditions India | BHG";
const seoDescription = "Searchable Indian disease database: 120+ conditions — symptoms, causes, tests, modern treatment, Ayurveda, herbs, nutrition. SEO pro + ItemList JSON-LD + earning.";
const url = "/diseases";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Diseases — 120+ India")}&category=${encodeURIComponent("Diseases")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function DiseasesPage() {
  return <DiseasesClient diseases={DISEASES} systems={DISEASE_SYSTEMS} categories={DISEASE_CATEGORIES} />;
}
