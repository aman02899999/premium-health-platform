import type { Metadata } from "next";
import SearchClient from "./SearchClient";
import { EXAMPLE_SEARCHES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search — Diseases, Herbs, Medicines, Foods & Tests",
  description: "Global health search across diseases, symptoms, medicines, herbs, nutrition, lab tests and articles with autocomplete.",
};

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <SearchLoader searchParams={searchParams} />;
}

async function SearchLoader({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  return <SearchClient initial={sp.q || ""} examples={EXAMPLE_SEARCHES} />;
}
