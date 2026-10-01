"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

type Interaction = {
  herb: string;
  drug: string;
  risk: "high" | "moderate" | "low";
  mechanism: string;
  advice: string;
  source: string;
};

const INTERACTIONS: Interaction[] = [
  { herb: "ashwagandha", drug: "sedative", risk: "moderate", mechanism: "Additive sedation", advice: "May increase drowsiness with sedatives, alcohol, benzodiazepines — avoid combining, inform clinician.", source: "MSKCC, Natural Medicines" },
  { herb: "ashwagandha", drug: "thyroid", risk: "moderate", mechanism: "May increase thyroid hormones", advice: "Monitor TFT if on levothyroxine — may need dose adjustment.", source: "Case reports" },
  { herb: "guggul", drug: "anticoagulant", risk: "moderate", mechanism: "Potential antiplatelet", advice: "Caution with warfarin, aspirin, clopidogrel — monitor bleeding.", source: "Natural Medicines" },
  { herb: "guggul", drug: "statin", risk: "low", mechanism: "May lower cholesterol additively", advice: "Traditional use for cholesterol — monitor lipids, inform clinician.", source: "Ayurveda + preclinical" },
  { herb: "turmeric", drug: "anticoagulant", risk: "moderate", mechanism: "High dose curcumin may inhibit platelets", advice: "Culinary doses safe; high-dose supplements caution with blood thinners.", source: "NIH, Natural Medicines" },
  { herb: "tulsi", drug: "anticoagulant", risk: "low", mechanism: "Eugenol may affect platelets", advice: "Normal tea use low risk; high-dose extract caution.", source: "Preclinical" },
  { herb: "giloy", drug: "immunosuppressant", risk: "moderate", mechanism: "Immunomodulatory", advice: "Avoid if on immunosuppressants post-transplant, autoimmune — discuss with doctor.", source: "Case reports 2020-21 liver injury — caution" },
  { herb: "licorice", drug: "diuretic", risk: "high", mechanism: "Hypokalemia, hypertension, pseudoaldosteronism", advice: "High-dose licorice + diuretics/low potassium risky — avoid chronic high dose.", source: "FDA, EMA" },
];

export function HerbDrugChecker() {
  const [herb, setHerb] = useState("ashwagandha");
  const [drug, setDrug] = useState("sedative");

  const matches = INTERACTIONS.filter((i) => i.herb.includes(herb.toLowerCase()) && i.drug.includes(drug.toLowerCase()));

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4 text-rose-600" /> Herb-Drug Interaction Checker — Unique Safety</h3>
      <p className="mt-1 text-[11px] text-stone-500">Educational, not diagnostic. India-relevant Ayurveda + allopathy combos. Always disclose herbs to clinician/pharmacist. Sources cited.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={herb} onChange={(e) => setHerb(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="ashwagandha">Ashwagandha</option>
          <option value="guggul">Guggul</option>
          <option value="turmeric">Turmeric / Curcumin</option>
          <option value="tulsi">Tulsi</option>
          <option value="giloy">Giloy / Guduchi</option>
          <option value="licorice">Licorice / Mulethi</option>
        </select>
        <select value={drug} onChange={(e) => setDrug(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="sedative">Sedatives / Sleep meds</option>
          <option value="anticoagulant">Blood thinners (warfarin, aspirin)</option>
          <option value="statin">Statins / Cholesterol</option>
          <option value="thyroid">Thyroid (levothyroxine)</option>
          <option value="immunosuppressant">Immunosuppressants</option>
          <option value="diuretic">Diuretics / BP</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {matches.length === 0 ? (
          <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-800">No high-risk match in local DB — but absence does NOT mean safe. Check with pharmacist + PubMed. This DB is limited to common Indian combos.</p>
        ) : (
          matches.map((m, idx) => (
            <div key={idx} className={`rounded-2xl border p-3 ${m.risk === "high" ? "border-rose-300 bg-rose-50 dark:bg-rose-950/30" : m.risk === "moderate" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-stone-200 bg-stone-50 dark:bg-stone-800"}`}>
              <p className="text-sm font-bold">{m.herb} + {m.drug} — {m.risk.toUpperCase()} RISK</p>
              <p className="mt-1 text-[12px]"><strong>Mechanism:</strong> {m.mechanism}</p>
              <p className="mt-1 text-[12px]"><strong>Advice:</strong> {m.advice}</p>
              <p className="mt-1 text-[11px] text-stone-500">Source: {m.source}</p>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 text-[11px] text-stone-400">Disclaimer: Traditional use ≠ proven efficacy. Herb-drug data often limited to case reports/preclinical. Do NOT stop prescribed medicines for herbs. Discuss with clinician, especially pregnancy, liver/kidney disease, surgery.</p>
    </div>
  );
}
