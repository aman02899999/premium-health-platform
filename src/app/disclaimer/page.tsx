import type { Metadata } from "next";
import { Breadcrumbs, EmergencyBox } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Medical Disclaimer", description: "Bharat Health Guide is educational information only — not diagnosis, treatment or emergency care. Read full disclaimer and emergency guidance." };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Disclaimer" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Medical Disclaimer</h1>
      <div className="mt-4 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>{SITE.disclaimer}</strong> Never disregard professional advice or delay seeking it because of something you read here.
      </div>
      <div className="prose-health mt-4 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
        <p><strong>Medicines:</strong> Never start, stop, reduce or change prescribed medicines without medical supervision. Medicine pages carry no personalised doses.</p>
        <p><strong>Herbs & Ayurveda:</strong> Traditional uses are distinguished from clinical evidence. Concentrated products can interact with medicines or harm liver/kidney — coordinate all practitioners.</p>
        <p><strong>Symptom tools & calculators:</strong> Educational estimates only, never diagnoses. Emergency symptoms need immediate care, not home tools.</p>
        <p><strong>Pregnancy & children:</strong> Extra caution applies. Doses are individual and weight-based; this site never provides personalised pediatric or obstetric dosing.</p>
        <p><strong>Monetisation:</strong> Ads and affiliates never override safety. Sponsored content will be clearly labelled.</p>
      </div>
      <div className="mt-4"><EmergencyBox signs={["Chest pain or pressure", "Severe difficulty breathing", "Sudden weakness / face droop / speech difficulty", "Severe allergic reaction or loss of consciousness", "Severe bleeding or suspected stroke", "Severe hypoglycaemia (confusion, seizures)"]} /></div>
    </div>
  );
}
