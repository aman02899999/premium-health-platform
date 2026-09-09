import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using Bharat Health Guide: educational use, no personal medical advice, acceptable use and liability limits." };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Terms of Use</h1>
      <p className="mt-1 text-xs text-stone-500">Last updated: August 2026</p>
      <div className="prose-health mt-4 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
        <p><strong>Educational only.</strong> Content is general health information, not personal medical advice, diagnosis or treatment. Always consult a qualified professional; in emergencies call emergency services.</p>
        <p><strong>Acceptable use:</strong> Do not misuse calculators or symptom tools as diagnostic devices, scrape content en masse, or submit unlawful content via forms.</p>
        <p><strong>Intellectual property:</strong> Text, design and illustrations are owned by the publication unless attributed. You may share links freely; reproduction needs permission.</p>
        <p><strong>Liability:</strong> To the maximum extent permitted by law, we are not liable for decisions made without professional advice. Nothing here creates a doctor-patient relationship.</p>
        <p><strong>Changes:</strong> We may update terms as features (accounts, ads, affiliates) launch; material changes will be noted here.</p>
      </div>
    </div>
  );
}
