import type { Metadata } from "next";
import DiseasesClient from "./DiseasesClient";
import { DISEASES, DISEASE_SYSTEMS, DISEASE_CATEGORIES } from "@/data/diseases-index";

export const metadata: Metadata = {
  title: "Disease Directory — Understand 120+ Conditions",
  description: "Searchable Indian disease database: symptoms, causes, tests, modern treatment, Ayurveda, herbs, nutrition and when to see a doctor.",
};

export default function DiseasesPage() {
  return <DiseasesClient diseases={DISEASES} systems={DISEASE_SYSTEMS} categories={DISEASE_CATEGORIES} />;
}
