import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { BmiCalc, CalorieCalc, ProteinCalc, WaterCalc, WaistHeightCalc, DiabetesRiskQuiz, HeartRiskEdu, IdealWeight } from "@/components/tools";

export const metadata: Metadata = {
  title: "Health Calculators — BMI, Calories, Protein, Diabetes & Heart Risk",
  description: "8 interactive Indian health calculators with Asian cut-offs. Estimates only — never diagnoses.",
};

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Health Calculators" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-teal-800 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black md:text-4xl">Health Calculators</h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-100/90">Asian cut-offs, Indian portions, honest limits. Every result is an <strong>estimate for education</strong> — confirm with lab tests and your doctor.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <BmiCalc /><IdealWeight /><CalorieCalc /><ProteinCalc /><WaterCalc /><WaistHeightCalc /><DiabetesRiskQuiz /><HeartRiskEdu />
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Calculators footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
