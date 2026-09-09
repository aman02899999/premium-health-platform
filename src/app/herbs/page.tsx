import type { Metadata } from "next";
import HerbsClient from "./HerbsClient";
import { HERBS } from "@/data/herbs";

export const metadata: Metadata = {
  title: "Herb Database — Ayurvedic Herbs with Evidence & Safety",
  description: "20 flagship Indian herbs: traditional uses, preparations, evidence summary, benefits, side effects, interactions and quality checks.",
};

export default function HerbsPage() {
  return <HerbsClient herbs={HERBS} />;
}
