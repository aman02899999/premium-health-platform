import type { Metadata } from "next";
import { Breadcrumbs } from "@/health/components/ui";
import { LeadGenForm } from "@/health/components/earning/LeadGen";
import { AffiliateProducts } from "@/health/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Book a Lab Test or Dietitian Consult",
  description: "Ask for a lab test or a dietitian consult — leave your number and we call you back.",
  alternates: { canonical: "/health/lead" },
};

export default function LeadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Book Service" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Book a Lab Test or Dietitian Consult</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Leave your name and mobile number — the team at Royal Fitness Club calls you back to arrange it. No spam, no sharing your number.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <LeadGenForm type="lab" title="Lab test" description="HbA1c, thyroid, lipid profile, vitamin D — tell us which tests and we'll call you back with options." />
          <LeadGenForm type="dietitian" title="Dietitian consult" description="A diet plan around Indian meals — for weight, diabetes, PCOS or training goals." />
        </div>
        <div className="space-y-4">
          <AffiliateProducts limit={3} />
        </div>
      </div>
    </div>
  );
}
