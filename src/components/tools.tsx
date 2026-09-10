"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, CheckCircle2, Info, OctagonAlert, Download, Crown } from "lucide-react";
import { cn } from "@/lib/format";
import {
  BMI_ASIAN, TDEE_FACTORS, PROTEIN_TARGETS, WHR_CUTOFF, WATER_GUIDANCE,
  bmiCategory, mifflinStJeor, idrsScore, clamp,
} from "@/lib/med-accuracy";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";

function PremiumReportUpsell({ reportSlug, price, title }: { reportSlug: string; price: number; title: string }) {
  const handleClick = () => {
    trackMonetizationEvent({ type: "premium_report_purchase", productId: reportSlug, page: "/health-calculators", cta: title, utm: getAttributionFromUrl() });
  };
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200"><Crown className="h-3.5 w-3.5" /> Premium Report — Educational — Not Diagnosis</p>
      <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300">Download detailed report: calculated values + interpretation + educational info + general lifestyle recommendations + questions to discuss with healthcare professional. No prescriptions, no diagnosis.</p>
      <Link href={`/store/${reportSlug}`} onClick={handleClick} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-900 hover:bg-amber-400">
        <Download className="h-3.5 w-3.5" /> {title} — ₹{price}
      </Link>
      <p className="mt-1 text-[10px] text-stone-400">Free calculator always free — premium report optional — educational resource.</p>
    </div>
  );
}

function Card({ title, desc, source, children }: { title: string; desc: string; source?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <p className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100"><Calculator className="h-4 w-4 text-emerald-600" />{title}</p>
      <p className="mb-1 mt-1 text-xs text-stone-500 dark:text-stone-400">{desc}</p>
      {source && <p className="mb-3 text-[11px] italic text-stone-400">Formula: {source}</p>}
      {!source && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Num({ label, value, set, min = 0, max = 500, step = 1, unit }: { label: string; value: number; set: (n: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">{label}{unit && <span className="text-stone-400">{unit}</span>}</span>
      <input
        type="number" value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          set(clamp(n, min, max, min));
        }}
        className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-emerald-400 dark:border-stone-700 dark:bg-stone-800"
      />
    </label>
  );
}

function Result({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" | "alert" }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "warn" ? AlertTriangle : OctagonAlert;
  return (
    <div className={cn(
      "mt-4 flex gap-2 rounded-xl p-3 text-sm font-medium",
      tone === "ok" && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
      tone === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
      tone === "alert" && "bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100"
    )}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function BmiCalc() {
  const [h, setH] = useState(165);
  const [w, setW] = useState(72);
  const bmi = h > 0 && w > 0 ? w / Math.pow(h / 100, 2) : NaN;
  const cat = bmiCategory(bmi);
  return (
    <Card title="BMI Calculator" desc="Asian-Indian cut-offs: healthy 18.5–22.9, overweight ≥23. Estimates only — not a diagnosis." source={BMI_ASIAN.source}>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Height" value={h} set={setH} min={50} max={250} unit="cm" />
        <Num label="Weight" value={w} set={setW} min={10} max={350} unit="kg" />
      </div>
      <Result tone={cat.tone}>
        {Number.isFinite(bmi) ? <>BMI: <strong>{bmi.toFixed(1)}</strong> — {cat.label}. {bmi >= 23 && "A gradual 5–10% weight goal with diet + activity is the evidence-based first step."}</> : cat.label}
      </Result>
      <PremiumReportUpsell reportSlug="bmi-wellness-report-49" price={49} title="Download Detailed BMI & Wellness Report" />
    </Card>
  );
}

export function CalorieCalc() {
  const [h, setH] = useState(165);
  const [w, setW] = useState(72);
  const [age, setAge] = useState(38);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [act, setAct] = useState(1.375);
  const bmr = mifflinStJeor(w, h, age, sex);
  const tdee = bmr * act;
  const floor = sex === "male" ? 1500 : 1200;
  const lossTarget = Math.max(floor, Math.round(tdee - 500));
  return (
    <Card title="BMR & Calorie Estimator" desc="Mifflin-St Jeor equation × activity factor. Weight-loss floors protect against crash dieting." source="Mifflin-St Jeor (1990); activity factors 1.2–1.9">
      <div className="grid grid-cols-2 gap-3">
        <Num label="Height" value={h} set={setH} min={50} max={250} unit="cm" />
        <Num label="Weight" value={w} set={setW} min={10} max={350} unit="kg" />
        <Num label="Age" value={age} set={setAge} min={10} max={110} unit="yrs" />
        <label className="block"><span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">Sex</span>
          <select value={sex} onChange={(e) => setSex(e.target.value as "male" | "female")} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 text-sm dark:border-stone-700 dark:bg-stone-800"><option value="male">Male</option><option value="female">Female</option></select>
        </label>
      </div>
      <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">Activity level</span>
        <select value={act} onChange={(e) => setAct(Number(e.target.value))} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 text-sm dark:border-stone-700 dark:bg-stone-800">
          {TDEE_FACTORS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </label>
      <Result>BMR ≈ <strong>{Math.round(bmr)} kcal</strong> · Maintenance ≈ <strong>{Math.round(tdee)} kcal</strong> · Gentle loss ≈ <strong>{lossTarget} kcal/day</strong> (never below {floor})</Result>
      <PremiumReportUpsell reportSlug="personalized-nutrition-report-99" price={99} title="Personalized Nutrition Report" />
    </Card>
  );
}

export function ProteinCalc() {
  const [w, setW] = useState(68);
  const [goal, setGoal] = useState(1.2);
  const g = w * goal;
  return (
    <Card title="Protein Calculator" desc="ICMR RDA 0.83 g/kg baseline; higher for weight-loss and training. Kidney disease: consult nephrology first." source="ICMR-NIN 2020 RDA 0.83 g/kg; ISSN/ADA therapeutic ranges">
      <div className="grid grid-cols-2 gap-3">
        <Num label="Weight" value={w} set={setW} min={10} max={350} unit="kg" />
        <label className="block"><span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">Goal</span>
          <select value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 text-sm dark:border-stone-700 dark:bg-stone-800">
            {PROTEIN_TARGETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <Result>Target ≈ <strong>{Math.round(g)} g/day</strong> (~{Math.round(g / 3)} g per meal). Dal + curd + paneer/soya/eggs across meals; CKD patients must personalise.</Result>
      <PremiumReportUpsell reportSlug="personalized-nutrition-report-99" price={99} title="Personalized Nutrition Report" />
    </Card>
  );
}

export function WaterCalc() {
  const [w, setW] = useState(68);
  const [heat, setHeat] = useState(1);
  const l = (w * WATER_GUIDANCE.mlPerKg * heat) / 1000;
  const glasses = Math.round(l * 4);
  return (
    <Card title="Water Intake Estimator" desc="30–35 ml/kg baseline from all fluids + food moisture. Heart/kidney disease: follow your doctor's fluid limit." source={WATER_GUIDANCE.source}>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Weight" value={w} set={setW} min={10} max={350} unit="kg" />
        <label className="block"><span className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300">Climate / activity</span>
          <select value={heat} onChange={(e) => setHeat(Number(e.target.value))} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 text-sm dark:border-stone-700 dark:bg-stone-800">
            <option value={0.9}>Winter, sedentary (×0.9)</option>
            <option value={1}>Normal (×1.0)</option>
            <option value={1.15}>Hot summer / workout days (×1.15)</option>
          </select>
        </label>
      </div>
      <Result>Target ≈ <strong>{l.toFixed(1)} L/day</strong> (~{glasses} glasses) from water + buttermilk + dal + fruits. Pale-yellow urine = well hydrated.</Result>
      <PremiumReportUpsell reportSlug="detailed-wellness-report-99" price={99} title="Detailed Wellness Report" />
    </Card>
  );
}

export function WaistHeightCalc() {
  const [waist, setWaist] = useState(92);
  const [h, setH] = useState(168);
  const r = h > 0 ? waist / h : NaN;
  const ok = Number.isFinite(r) && r < WHR_CUTOFF.value;
  return (
    <Card title="Waist-to-Height Ratio" desc="Keep waist < half your height — the best single belly-fat risk signal across ethnicities." source={WHR_CUTOFF.source}>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Waist (at navel, exhaled)" value={waist} set={setWaist} min={30} max={250} unit="cm" />
        <Num label="Height" value={h} set={setH} min={50} max={250} unit="cm" />
      </div>
      <Result tone={!Number.isFinite(r) ? "warn" : ok ? "ok" : "alert"}>
        {Number.isFinite(r) ? <>Ratio: <strong>{r.toFixed(2)}</strong> {ok ? "— healthy (<0.50). Maintain with activity + diet." : "— above 0.50: higher diabetes/heart risk. Target gradual waist loss (~0.5 cm/week)."}</> : "Enter valid measurements."}
      </Result>
      <PremiumReportUpsell reportSlug="detailed-wellness-report-99" price={99} title="Detailed Wellness Report" />
    </Card>
  );
}

/** True Indian Diabetes Risk Score (Mohan et al., MDRF). */
export function DiabetesRiskQuiz() {
  const [age, setAge] = useState<0 | 20 | 30>(20);
  const [waist, setWaist] = useState<0 | 10 | 20>(10);
  const [activity, setActivity] = useState<0 | 10 | 20 | 30>(20);
  const [family, setFamily] = useState<0 | 10 | 20>(0);
  const r = idrsScore({ ageBand: age, waistBand: waist, activityBand: activity, familyBand: family });
  const rows: { label: string; value: number; set: (n: number) => void; opts: [string, number][] }[] = [
    { label: "Age", value: age, set: (n) => setAge(n as 0 | 20 | 30), opts: [["<35 yrs (0)", 0], ["35–49 (20)", 20], ["50+ (30)", 30]] },
    { label: "Waist (M<90/F<80 → 0 · M90–99/F80–89 → 10 · M≥100/F≥90 → 20)", value: waist, set: (n) => setWaist(n as 0 | 10 | 20), opts: [["Normal (0)", 0], ["Mid (10)", 10], ["High (20)", 20]] },
    { label: "Physical activity", value: activity, set: (n) => setActivity(n as 0 | 10 | 20 | 30), opts: [["Vigorous (0)", 0], ["Moderate (10)", 10], ["Mild (20)", 20], ["Sedentary (30)", 30]] },
    { label: "Family history of diabetes", value: family, set: (n) => setFamily(n as 0 | 10 | 20), opts: [["None (0)", 0], ["One parent (10)", 10], ["Both parents (20)", 20]] },
  ];
  return (
    <Card title="Indian Diabetes Risk Score (IDRS)" desc="Validated MDRF questionnaire: <30 low, 30–50 medium, ≥60 high. Screening only — HbA1c confirms." source="Mohan et al., Madras Diabetes Research Foundation">
      <div className="space-y-2 text-sm">
        {rows.map((q) => (
          <div key={q.label} className="rounded-xl bg-stone-50 p-2.5 dark:bg-stone-800">
            <span className="block text-[13px] font-medium">{q.label}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {q.opts.map(([label, val]) => (
                <button key={label} onClick={() => q.set(val)} aria-pressed={q.value === val} className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", q.value === val ? "bg-emerald-700 text-white" : "border bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300")}>{label}</button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <Result tone={r.level === "Low" ? "ok" : r.level === "Medium" ? "warn" : "alert"}>
        IDRS: <strong>{r.score}/100 — {r.level} risk</strong>. {r.advice} <Link href="/lab-tests/hba1c" className="underline">HbA1c guide</Link> · <Link href="/diseases/prediabetes" className="underline">Prediabetes guide</Link>
      </Result>
      <PremiumReportUpsell reportSlug="personalized-nutrition-report-99" price={99} title="Personalized Nutrition Report — Diabetes Risk" />
    </Card>
  );
}

export function HeartRiskEdu() {
  const [f, setF] = useState({ smoke: false, bp: true, sugar: false, chol: false, family: false });
  const count = Object.values(f).filter(Boolean).length;
  return (
    <Card title="Heart-Risk Factor Check" desc="Counts 5 major modifiable risks (WHO HEARTS approach). Not a Framingham/ASCVD % score — ask your doctor for formal 10-year risk." source="WHO HEARTS risk-factor framework">
      <div className="grid grid-cols-1 gap-2 text-sm">
        {[["smoke", "Smoke or use tobacco in any form?"], ["bp", "BP ≥140/90 or on BP medicines?"], ["sugar", "Diabetes or HbA1c ≥6.5%?"], ["chol", "LDL ≥130 or on statin?"], ["family", "Heart attack in family (M<55 / F<65)?"]].map(([k, label]) => (
          <button key={k} onClick={() => setF({ ...f, [k]: !(f as Record<string, boolean>)[k] })} aria-pressed={(f as Record<string, boolean>)[k]} className={cn("flex items-center justify-between rounded-xl border p-2.5 text-left text-[13px] font-medium", (f as Record<string, boolean>)[k] ? "border-amber-300 bg-amber-50 dark:bg-amber-950/40" : "border-stone-200 dark:border-stone-700")}>
            {label}<span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", (f as Record<string, boolean>)[k] ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-500 dark:bg-stone-800")}>{(f as Record<string, boolean>)[k] ? "Yes" : "No"}</span>
          </button>
        ))}
      </div>
      <Result tone={count === 0 ? "ok" : count === 1 ? "warn" : "alert"}>
        {count} of 5 risk factors. {count >= 2 ? <>Discuss <Link href="/lab-tests/lipid-profile" className="underline">lipid profile</Link>, BP optimisation and a formal 10-year risk score with your doctor. Read <Link href="/diseases/cardiovascular-risk" className="underline">cardiovascular risk</Link>.</> : count === 1 ? "One factor to fix now — early action prevents the second." : "Protect this status: no tobacco, active life, healthy weight, annual BP + sugar checks."}
      </Result>
      <PremiumReportUpsell reportSlug="detailed-wellness-report-99" price={99} title="Detailed Wellness Report — Heart Risk" />
    </Card>
  );
}

export function IdealWeight() {
  const [h, setH] = useState(168);
  const low = 18.5 * Math.pow(h / 100, 2);
  const highAsian = 22.9 * Math.pow(h / 100, 2);
  const highWho = 24.9 * Math.pow(h / 100, 2);
  return (
    <Card title="Healthy Weight Range" desc="Asian BMI 18.5–22.9 (strict) shown with WHO 18.5–24.9 for reference. Athletes, elderly and pregnancy differ." source="WHO Asia-Pacific 18.5–22.9; WHO global 18.5–24.9">
      <Num label="Height" value={h} set={setH} min={50} max={250} unit="cm" />
      <Result>Asian healthy range ≈ <strong>{low.toFixed(1)}–{highAsian.toFixed(1)} kg</strong> · WHO range ≤<strong>{highWho.toFixed(1)} kg</strong> for {h} cm. Aim for gradual progress (~0.5 kg/week).</Result>
      <PremiumReportUpsell reportSlug="bmi-wellness-report-49" price={49} title="Detailed BMI & Wellness Report" />
    </Card>
  );
}

// ---------- Symptom checker ----------
const EMERGENCY_PATTERNS = [
  "chest", "breathless", "breathing difficulty", "faint", "collapse", "stroke",
  "bleeding", "suicide", "self-harm", "seizure", "unconscious", "blue lips",
];

export function SymptomChecker() {
  const [symptom, setSymptom] = useState("Fever");
  const [duration, setDuration] = useState("2–3 days");
  const [severity, setSeverity] = useState("Moderate — affects routine");
  const [age, setAge] = useState("Adult (18–60)");
  const [extra, setExtra] = useState<string[]>(["Fatigue"]);
  const extras = ["Fatigue", "Cough", "Headache", "Burning urination", "Chest discomfort", "Breathlessness", "Vomiting", "Rash"];
  const emergency = useMemo(() => {
    const t = `${symptom} ${extra.join(" ")} ${severity}`.toLowerCase();
    return EMERGENCY_PATTERNS.some((k) => t.includes(k)) || severity.startsWith("Severe");
  }, [symptom, extra, severity]);
  const childOrSenior = age.startsWith("Child") || age.startsWith("Senior");

  const urgency = emergency
    ? "Urgent — same-hour evaluation at emergency / casualty."
    : childOrSenior && (severity.startsWith("Moderate") || duration !== "<24 hours")
      ? "Prompt — same-day doctor visit (children and seniors decompensate faster)."
      : severity.startsWith("Moderate") || duration === ">2 weeks"
        ? "Prompt — same-week doctor visit with basic tests."
        : "Routine — home care + watch for 48–72 hours; visit if not improving or any red flag appears.";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-bold">Tell us (educational only — not a diagnosis)</p>
        <div className="mt-3 space-y-3 text-sm">
          <label className="block"><span className="mb-1 block text-xs font-semibold">Main symptom</span>
            <select value={symptom} onChange={(e) => setSymptom(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 dark:border-stone-700 dark:bg-stone-800">
              {["Fever", "Cough", "Headache", "Fatigue", "Chest discomfort", "Breathlessness", "Abdominal pain", "Burning urination", "Joint pain", "Dizziness"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1 block text-xs font-semibold">Duration</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 dark:border-stone-700 dark:bg-stone-800">
                {["<24 hours", "2–3 days", "1–2 weeks", ">2 weeks"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block"><span className="mb-1 block text-xs font-semibold">Severity</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 dark:border-stone-700 dark:bg-stone-800">
                {["Mild — daily life normal", "Moderate — affects routine", "Severe — cannot function / alarming"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className="mb-1 block text-xs font-semibold">Age group</span>
            <select value={age} onChange={(e) => setAge(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 dark:border-stone-700 dark:bg-stone-800">
              {["Child (<12)", "Teen (12–17)", "Adult (18–60)", "Senior (60+)"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div>
            <p className="mb-1 text-xs font-semibold">Associated symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {extras.map((x) => (
                <button key={x} onClick={() => setExtra(extra.includes(x) ? extra.filter((e) => e !== x) : [...extra, x])} aria-pressed={extra.includes(x)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", extra.includes(x) ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-300")}>{x}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-emerald-50/60 p-5 dark:border-stone-700 dark:from-stone-900 dark:to-emerald-950/30">
        <p className="text-sm font-bold">Educational guidance</p>
        {emergency && (
          <div className="mt-3 flex gap-2 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-[13px] font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Possible emergency pattern — seek urgent care now. Do not wait for home remedies. Call emergency services (112 in India) or go to the nearest hospital.
          </div>
        )}
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-stone-700 dark:text-stone-200">
          <li className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /> <span><strong>Pattern:</strong> {symptom} for {duration}, {severity.split(" — ")[0].toLowerCase()}, {age.toLowerCase()}{extra.length ? ` with ${extra.join(", ").toLowerCase()}` : ""}.</span></li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span><strong>Questions to consider:</strong> fever trend and hydration? recent travel, new medicines or missed doses? BP/sugar comorbidity? pregnancy possibility?</span></li>
          <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> <span><strong>Urgency:</strong> {urgency}</span></li>
        </ul>
        <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-stone-600 dark:bg-stone-900/60 dark:text-stone-300">This tool does <strong>not</strong> diagnose. It lists categories to discuss with a doctor. Explore: <Link href="/symptoms/fever" className="text-emerald-700 underline">fever</Link> · <Link href="/symptoms/chest-pain" className="text-emerald-700 underline">chest pain</Link> · <Link href="/symptoms/breathlessness" className="text-emerald-700 underline">breathlessness</Link> · <Link href="/symptoms/burning-urination" className="text-emerald-700 underline">burning urination</Link></p>
      </div>
    </div>
  );
}
