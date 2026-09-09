import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { LAB_TESTS } from "@/data/clinical";
import { Breadcrumbs, TopicCard, InfoNote, AdSlot } from "@/components/ui";

export const metadata: Metadata = {
  title: "Lab Test Database — Understand Your Reports",
  description: "HbA1c, lipids, TSH, vitamin D, creatinine and more: what each test measures, preparation, abnormal meanings and questions to ask.",
};

export default function LabTestsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Lab Tests" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-cyan-800 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Lab Test Database</h1>
        <p className="mt-2 max-w-2xl text-sm text-cyan-100/90">What each test measures, why doctors order it, how to prepare, what abnormal values can mean — and their limits. Never diagnose from one value alone.</p>
      </div>
      <div className="mt-4"><InfoNote text="Reference ranges vary slightly by lab and method. Always interpret reports with your doctor, who knows your medicines, symptoms and trends." /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAB_TESTS.map((l) => (
          <TopicCard key={l.slug} href={`/lab-tests/${l.slug}`} title={l.name} desc={l.short} icon={<FlaskConical className="h-5 w-5" />} badge={<span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">{l.shortName || "Test"}</span>} />
        ))}
      </div>
      <div className="mt-8"><AdSlot slot="Directory footer" /></div>
    </div>
  );
}
