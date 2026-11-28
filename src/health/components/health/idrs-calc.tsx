"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { idrs, type ActivityIdrs, type FamilyHistory, type Sex } from "@/lib/calculators";

export function IDRScalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(40);
  const [waist, setWaist] = useState(90);
  const [activity, setActivity] = useState<ActivityIdrs>("mild");
  const [family, setFamily] = useState<FamilyHistory>("one");

  // Shared with the gym site's calculator so both give the same answer (Mohan et al., JAPI 2005).
  const { score, risk } = idrs(sex, age, waist, activity, family);
  const color = risk === "Low" ? "bg-emerald-100 text-emerald-800" : risk === "Moderate" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Calculator className="h-4 w-4 text-indigo-600" /> IDRS — Indian Diabetes Risk Score</h3>
      <p className="mt-1 text-[11px] text-stone-500">Validated for Indians (Mohan et al., CURES). Educational screening only — not diagnosis.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Sex
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="text-sm">Age: {age} <input type="range" min={20} max={70} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" /></label>
        <label className="text-sm">Waist (cm): {waist} <input type="range" min={70} max={120} value={waist} onChange={(e) => setWaist(Number(e.target.value))} className="w-full" /></label>
        <label className="text-sm">Physical activity
          <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityIdrs)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
            <option value="vigorous">Vigorous exercise or hard physical work</option>
            <option value="moderate">Moderate exercise or work</option>
            <option value="mild">Mild exercise or work</option>
            <option value="sedentary">No exercise, desk job</option>
          </select>
        </label>
        <label className="text-sm">Family history
          <select value={family} onChange={(e) => setFamily(e.target.value as FamilyHistory)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
            <option value="none">No parent diabetic</option>
            <option value="one">One parent</option>
            <option value="both">Both parents</option>
          </select>
        </label>
      </div>
      <div className={`mt-4 rounded-2xl p-4 ${color}`}>
        <p className="text-sm font-bold">IDRS: {score} — {risk} risk</p>
        <p className="mt-1 text-[12px]">{risk === "Low" ? "Low: maintain lifestyle, yearly check." : risk === "Moderate" ? "Moderate: 30 min walk + HbA1c." : "High: See clinician, HbA1c + fasting."}</p>
      </div>
      <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">Source: Mohan V et al., JAPI 2005, CURES. &lt;30 low, 30–50 moderate, 60 or more high. Waist cut-offs: men 90/100 cm, women 80/90 cm.</p>
    </div>
  );
}
