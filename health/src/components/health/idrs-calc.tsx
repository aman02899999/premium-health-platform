"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

export function IDRScalc() {
  const [age, setAge] = useState(40);
  const [waist, setWaist] = useState(90);
  const [activity, setActivity] = useState("mild");
  const [family, setFamily] = useState("one");

  const calc = () => {
    let score = 0;
    if (age < 35) score += 0;
    else if (age < 50) score += 20;
    else score += 30;
    if (waist < 90) score += 0;
    else if (waist < 100) score += 10;
    else score += 20;
    if (activity === "vigorous") score += 0;
    else if (activity === "mild") score += 20;
    else score += 30;
    if (family === "none") score += 0;
    else if (family === "one") score += 10;
    else score += 20;
    return score;
  };

  const score = calc();
  const risk = score < 30 ? "Low" : score < 50 ? "Moderate" : "High";
  const color = score < 30 ? "bg-emerald-100 text-emerald-800" : score < 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Calculator className="h-4 w-4 text-indigo-600" /> IDRS — Indian Diabetes Risk Score (Unique)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Validated for Indians (Mohan et al., CURES). Educational screening only — not diagnosis.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Age: {age} <input type="range" min={20} max={70} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" /></label>
        <label className="text-sm">Waist (cm): {waist} <input type="range" min={70} max={120} value={waist} onChange={(e) => setWaist(Number(e.target.value))} className="w-full" /></label>
        <label className="text-sm">Physical activity
          <select value={activity} onChange={(e) => setActivity(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
            <option value="vigorous">Vigorous</option>
            <option value="mild">Mild</option>
            <option value="sedentary">Sedentary</option>
          </select>
        </label>
        <label className="text-sm">Family history
          <select value={family} onChange={(e) => setFamily(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
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
      <p className="mt-2 text-[11px] text-stone-400">Source: Mohan V et al., JAPI 2005, CURES. &lt;30 low, 30-50 moderate, ≥60 high.</p>
    </div>
  );
}
