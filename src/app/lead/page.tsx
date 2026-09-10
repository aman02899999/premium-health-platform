import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { LeadGenForm } from "@/components/earning/LeadGen";
import { AffiliateProducts } from "@/components/earning/AffiliateProducts";

export const metadata: Metadata = {
  title: "Book Lab Test / Dietitian / Insurance — Lead Gen Earning",
  description: "Book lab tests, dietitian consult, insurance — high ticket lead gen Rs 150-500, UTM + gtag tracked, SEO optimized.",
  alternates: { canonical: "/lead" },
};

export default function LeadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Book Service" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Book Lab / Dietitian / Insurance — Lead Gen Earning</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">High ticket, high intent: HbA1c, thyroid, lipids, dietitian, insurance — India-specific. Tracked via UTM + gtag generate_lead. SEO optimized.</p>
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
