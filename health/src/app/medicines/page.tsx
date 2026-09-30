import type { Metadata } from "next";
import Link from "next/link";
import { Pill, ShieldAlert } from "lucide-react";
import { MEDICINES } from "@/data/medicines";
import { Breadcrumbs, TopicCard, AdSlot } from "@/components/ui";

export const metadata: Metadata = {
  title: "Allopathy Medicines — Safe, Educational Drug Guides",
  description: "Generic-first medicine education: uses, mechanism, side effects, interactions, warnings and monitoring. No prescriptions, no doses.",
};

export default function MedicinesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Medicines" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Allopathy Medicines</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Educational information only. Medication decisions should be made with a qualified healthcare professional. We use generic names prominently and never provide personalised doses.</p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs leading-relaxed"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Never start, stop, replace or change the dose of a prescription medicine without medical supervision. If you have side effects, contact your doctor or pharmacist promptly.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MEDICINES.map((m) => (
          <TopicCard key={m.slug} href={`/medicines/${m.slug}`} title={m.genericName} hindi={m.drugClass} desc={m.short} icon={<Pill className="h-5 w-5" />} />
        ))}
      </div>
      <p className="mt-6 text-sm text-stone-600 dark:text-stone-300">Looking for a condition instead? <Link href="/diseases" className="font-bold text-emerald-700 underline">Browse diseases →</Link></p>
      <div className="mt-6"><AdSlot slot="Directory footer" /></div>
    </div>
  );
}
