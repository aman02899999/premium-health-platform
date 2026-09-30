import type { Metadata } from "next";
import HerbsClient from "./HerbsClient";
import { HERBS } from "@/data/herbs";
import { SITE } from "@/lib/site";

const seoTitle = "Herbs Directory — Ashwagandha, Giloy, Turmeric | BHG";
const seoDescription = "Ayurvedic herbs: ashwagandha, giloy, turmeric, shatavari — evidence, uses, safety, interactions. SEO pro + Product JSON-LD + affiliate earning.";
const url = "/herbs";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Herbs — Ayurveda India")}&category=${encodeURIComponent("Herbs")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function HerbsPage() {
  return <HerbsClient herbs={HERBS} />;
}
