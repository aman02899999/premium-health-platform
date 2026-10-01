import type { Metadata } from "next";
import { Breadcrumbs } from "@/health/components/ui";
import { LeadGenForm } from "@/health/components/earning/LeadGen";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Book Lab Test / Dietitian / Insurance",
  description: "Book lab tests, a dietitian consult or health insurance through trusted local partners.",
  alternates: { canonical: "/health/lead" },
};

export default function LeadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Book Service" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Book Lab / Dietitian / Insurance</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">HbA1c, thyroid and lipid tests, dietitian consults and health insurance — we connect you with trusted local partners.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <LeadGenForm type="lab" title="Book Lab Test — Rs 150 lead" description="HbA1c, thyroid, lipid, vitamin D — partner labs, home collection." />
          <LeadGenForm type="dietitian" title="Dietitian Consult — Rs 300 lead" description="Personalized thali, millet swap, diabetes diet — 1:1 consult." />
          <LeadGenForm type="insurance" title="Health Insurance — Rs 500 lead" description="Compare health insurance — high ticket, high intent." />
        </div>
        <div className="space-y-4">
          <AffiliateProducts limit={3} />
        </div>
      </div>
    </div>
  );
}
