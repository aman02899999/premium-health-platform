import type { Metadata } from "next";
import SearchClient from "./SearchClient";
import { EXAMPLE_SEARCHES } from "@/lib/site";
import { SITE } from "@/lib/site";

const seoTitle = "Search — Diseases, Herbs, Foods, Yoga | BHG";
const seoDescription = "Global health search across diseases, symptoms, medicines, herbs, nutrition, lab tests and articles with autocomplete. SEO pro + earning + India-first.";
const url = "/search";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Search — BHG India")}&category=${encodeURIComponent("Search")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
  twitter: { card: "summary_large_image", title: seoTitle, description: seoDescription, images: [ogImage] },
};

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <SearchLoader searchParams={searchParams} />;
}

async function SearchLoader({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  return <SearchClient initial={sp.q || ""} examples={EXAMPLE_SEARCHES} />;
}
