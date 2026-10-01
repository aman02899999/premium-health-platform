"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ACTIVITY_LEVELS,
  bmi,
  bodyFatNavy,
  heartRateZones,
  idealWeight,
  macros,
  oneRepMax,
  tdee,
  waterIntake,
  calculatorByKey,
  fastingWindow,
  FAST_PROTOCOLS,
  idrs,
  waistToHeight,
  type ActivityIdrs,
  type FamilyHistory,
  type ActivityId,
  type CalculatorKey,
  type Goal,
  type Sex,
} from "@/lib/calculators";
import { Icon } from "@/components/Icon";

// ---------- inputs ----------

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/75">{label}</span>
        <span className="flex items-center gap-1">
          <input
            type="number"
            value={draft ?? String(value)}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              setDraft(e.target.value);
              const v = Number(e.target.value);
              // Only commit in-range values so half-typed numbers never feed the formulas.
              if (e.target.value !== "" && v >= min && v <= max) onChange(v);
            }}
            onBlur={() => setDraft(null)}
            className="w-20 rounded-lg border border-line bg-black/40 px-2 py-1 text-right font-semibold text-white outline-none focus:border-brand"
            aria-label={`${label} (${unit})`}
          />
          <span className="w-8 text-white/50">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(90deg, var(--color-brand) ${pct}%, #1d3a57 ${pct}%)`, height: 6, borderRadius: 9, appearance: "none" }}
        aria-label={label}
      />
    </label>
  );
}

function Toggle<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${value === o.v ? "bg-brand text-white" : "text-white/70 hover:text-white"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const SEX_OPTS: { v: Sex; l: string }[] = [
  { v: "male", l: "Male" },
  { v: "female", l: "Female" },
];

function ActivitySelect({ value, onChange }: { value: ActivityId; onChange: (v: ActivityId) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/75">Activity level</span>
      <select value={value} onChange={(e) => onChange(e.target.value as ActivityId)} className="field">
        {ACTIVITY_LEVELS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------- outputs ----------

function Big({ value, unit, label, tone = "brand" }: { value: ReactNode; unit?: string; label: string; tone?: "brand" | "white" }) {
  return (
    <div className="rounded-2xl bg-black/35 p-4 text-center ring-1 ring-white/10">
      {/* Word results ("Overweight", "Obese (Class I)") get a smaller size so they fit the card. */}
      <div className={`font-display break-words ${typeof value === "string" && value.length > 7 ? "text-2xl leading-tight" : "text-4xl"} ${tone === "brand" ? "text-brand-gradient" : "text-white"}`}>
        {value}
        {unit && <span className="ml-1 text-lg text-white/60">{unit}</span>}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/55">{label}</div>
    </div>
  );
}

function Gauge({ value, min, max, bands }: { value: number; min: number; max: number; bands: { to: number; color: string; label: string }[] }) {
  const clamp = Math.min(max, Math.max(min, value));
  const angle = ((clamp - min) / (max - min)) * 180 - 90;
  const arcs = bands.map((b, i) => {
    const from = i === 0 ? min : bands[i - 1].to;
    const a0 = ((from - min) / (max - min)) * Math.PI;
    const a1 = ((Math.min(b.to, max) - min) / (max - min)) * Math.PI;
    const p = (a: number) => `${100 - 80 * Math.cos(a)} ${100 - 80 * Math.sin(a)}`;
    return <path key={b.label} d={`M ${p(a0)} A 80 80 0 0 1 ${p(a1)}`} stroke={b.color} strokeWidth="16" fill="none" />;
  });
  return (
    <svg viewBox="0 0 200 115" className="mx-auto w-full max-w-xs" role="img" aria-label={`Gauge reading ${value}`}>
      {arcs}
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform .8s cubic-bezier(.2,.8,.2,1)" }}>
        <line x1="100" y1="100" x2="100" y2="32" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="7" fill="#e8394b" />
    </svg>
  );
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1;
  const parts = [
    { l: "Protein", g: protein, kcal: protein * 4, c: "#e8394b" },
    { l: "Carbs", g: carbs, kcal: carbs * 4, c: "#7cc0ee" },
    { l: "Fat", g: fat, kcal: fat * 9, c: "#f59e0b" },
  ];
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full">
        {parts.map((p) => (
          <div key={p.l} style={{ width: `${(p.kcal / total) * 100}%`, background: p.c, transition: "width .6s" }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {parts.map((p) => (
          <div key={p.l} className="rounded-xl bg-black/35 p-3 text-center ring-1 ring-white/10">
            <div className="text-2xl font-bold text-white">{p.g}g</div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full" style={{ background: p.c }} />
              {p.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- calculators ----------

function BmiCalc() {
  const [w, setW] = useState(70);
  const [h, setH] = useState(170);
  const r = bmi(w, h);
  return (
    <Layout
      inputs={
        <>
          <Slider label="Weight" value={w} onChange={setW} min={30} max={200} unit="kg" />
          <Slider label="Height" value={h} onChange={setH} min={120} max={220} unit="cm" />
        </>
      }
      result={
        <>
          <Gauge
            value={r.value}
            min={14}
            max={35}
            bands={[
              { to: 18.5, color: "#6ea8fe", label: "Under" },
              { to: 23, color: "#34d399", label: "Healthy" },
              { to: 25, color: "#fbbf24", label: "Over" },
              { to: 35, color: "#e8394b", label: "Obese" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Big value={r.value} label="Your BMI" />
            <Big value={r.category} label="Category" tone="white" />
          </div>
          <p className="text-center text-sm text-white/65">
            Healthy weight for your height: <strong className="text-white">{r.healthyMin}–{r.healthyMax} kg</strong>
          </p>
        </>
      }
    />
  );
}

function TdeeCalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(28);
  const [w, setW] = useState(75);
  const [h, setH] = useState(172);
  const [act, setAct] = useState<ActivityId>("moderate");
  const r = tdee(sex, w, h, age, act);
  return (
    <Layout
      inputs={
        <>
          <Toggle label="Sex" value={sex} onChange={setSex} options={SEX_OPTS} />
          <Slider label="Age" value={age} onChange={setAge} min={15} max={80} unit="yrs" />
          <Slider label="Weight" value={w} onChange={setW} min={30} max={200} unit="kg" />
          <Slider label="Height" value={h} onChange={setH} min={120} max={220} unit="cm" />
          <ActivitySelect value={act} onChange={setAct} />
        </>
      }
      result={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Big value={r.maintain.toLocaleString("en-IN")} unit="kcal" label="Maintenance (TDEE)" />
            <Big value={r.bmr.toLocaleString("en-IN")} unit="kcal" label="BMR (at rest)" tone="white" />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              { l: "Fat loss", v: r.fatLoss },
              { l: "Slow cut", v: r.mildLoss },
              { l: "Lean gain", v: r.gain },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-black/35 p-3 ring-1 ring-white/10">
                <div className="font-bold text-white">{x.v.toLocaleString("en-IN")}</div>
                <div className="text-xs text-white/55">{x.l}</div>
              </div>
            ))}
          </div>
        </>
      }
    />
  );
}

function BodyFatCalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [h, setH] = useState(172);
  const [neck, setNeck] = useState(38);
  const [waist, setWaist] = useState(86);
  const [hip, setHip] = useState(96);
  const r = bodyFatNavy(sex, h, neck, waist, hip);
  return (
    <Layout
      inputs={
        <>
          <Toggle label="Sex" value={sex} onChange={setSex} options={SEX_OPTS} />
          <Slider label="Height" value={h} onChange={setH} min={120} max={220} unit="cm" />
          <Slider label="Neck" value={neck} onChange={setNeck} min={25} max={60} step={0.5} unit="cm" />
          <Slider label={sex === "male" ? "Waist (at navel)" : "Waist (narrowest)"} value={waist} onChange={setWaist} min={50} max={160} step={0.5} unit="cm" />
          {sex === "female" && <Slider label="Hips (widest)" value={hip} onChange={setHip} min={60} max={170} step={0.5} unit="cm" />}
        </>
      }
      result={
        r ? (
          <>
            <Gauge
              value={r.value}
              min={3}
              max={45}
              bands={
                sex === "male"
                  ? [
                      { to: 6, color: "#6ea8fe", label: "Essential" },
                      { to: 14, color: "#34d399", label: "Athletic" },
                      { to: 18, color: "#a3e635", label: "Fit" },
                      { to: 25, color: "#fbbf24", label: "Average" },
                      { to: 45, color: "#e8394b", label: "High" },
                    ]
                  : [
                      { to: 14, color: "#6ea8fe", label: "Essential" },
                      { to: 21, color: "#34d399", label: "Athletic" },
                      { to: 25, color: "#a3e635", label: "Fit" },
                      { to: 32, color: "#fbbf24", label: "Average" },
                      { to: 45, color: "#e8394b", label: "High" },
                    ]
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Big value={r.value} unit="%" label="Body fat" />
              <Big value={r.category} label="Category" tone="white" />
            </div>
          </>
        ) : (
          <p className="text-center text-white/65">Waist must be larger than neck — please check your measurements.</p>
        )
      }
    />
  );
}

function OneRmCalc() {
  const [w, setW] = useState(60);
  const [reps, setReps] = useState(6);
  const r = oneRepMax(w, reps);
  return (
    <Layout
      inputs={
        <>
          <Slider label="Weight lifted" value={w} onChange={setW} min={5} max={300} step={2.5} unit="kg" />
          <Slider label="Reps completed" value={reps} onChange={setReps} min={1} max={12} unit="reps" />
        </>
      }
      result={
        <>
          <Big value={r.estimate} unit="kg" label="Estimated 1RM" />
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-left text-xs uppercase tracking-wider text-brand">
                <tr>
                  <th className="px-3 py-2">% 1RM</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">≈ Reps</th>
                </tr>
              </thead>
              <tbody>
                {r.table.map((row) => (
                  <tr key={row.pct} className="border-t border-white/5">
                    <td className="px-3 py-1.5 text-white/70">{row.pct}%</td>
                    <td className="px-3 py-1.5 font-semibold text-white">{row.weight} kg</td>
                    <td className="px-3 py-1.5 text-white/70">{row.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    />
  );
}

function MacroCalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(28);
  const [w, setW] = useState(70);
  const [h, setH] = useState(172);
  const [act, setAct] = useState<ActivityId>("moderate");
  const [goal, setGoal] = useState<Goal>("gain");
  const m = macros(tdee(sex, w, h, age, act).maintain, w, goal);
  return (
    <Layout
      inputs={
        <>
          <Toggle label="Goal" value={goal} onChange={setGoal} options={[{ v: "lose", l: "Lose fat" }, { v: "maintain", l: "Maintain" }, { v: "gain", l: "Build muscle" }]} />
          <Toggle label="Sex" value={sex} onChange={setSex} options={SEX_OPTS} />
          <Slider label="Age" value={age} onChange={setAge} min={15} max={80} unit="yrs" />
          <Slider label="Weight" value={w} onChange={setW} min={30} max={200} unit="kg" />
          <Slider label="Height" value={h} onChange={setH} min={120} max={220} unit="cm" />
          <ActivitySelect value={act} onChange={setAct} />
        </>
      }
      result={
        <>
          <Big value={m.calories.toLocaleString("en-IN")} unit="kcal/day" label="Daily target" />
          <MacroBar protein={m.protein} carbs={m.carbs} fat={m.fat} />
          <p className="text-center text-xs text-white/55">
            ≈ {Math.round(m.protein / 18)} servings of 100 g paneer-equivalent protein a day, spread over 4–5 meals.
          </p>
        </>
      }
    />
  );
}

function IdealCalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [h, setH] = useState(172);
  const r = idealWeight(sex, h);
  return (
    <Layout
      inputs={
        <>
          <Toggle label="Sex" value={sex} onChange={setSex} options={SEX_OPTS} />
          <Slider label="Height" value={h} onChange={setH} min={140} max={220} unit="cm" />
        </>
      }
      result={
        <>
          <Big value={r.average} unit="kg" label="Average ideal weight" />
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            {(["devine", "robinson", "miller", "hamwi"] as const).map((k) => (
              <div key={k} className="rounded-xl bg-black/35 p-3 ring-1 ring-white/10">
                <div className="font-bold text-white">{r[k]} kg</div>
                <div className="text-xs capitalize text-white/55">{k}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-white/65">
            Healthy BMI range (Asian): <strong className="text-white">{r.bmiRange[0]}–{r.bmiRange[1]} kg</strong>
          </p>
        </>
      }
    />
  );
}

function WaterCalc() {
  const [w, setW] = useState(70);
  const [mins, setMins] = useState(60);
  const [hot, setHot] = useState(true);
  const r = waterIntake(w, mins, hot);
  const fill = Math.min(100, (r.litres / 5) * 100);
  return (
    <Layout
      inputs={
        <>
          <Slider label="Body weight" value={w} onChange={setW} min={30} max={200} unit="kg" />
          <Slider label="Workout today" value={mins} onChange={setMins} min={0} max={180} step={15} unit="min" />
          <Toggle label="Weather" value={hot ? "hot" : "mild"} onChange={(v) => setHot(v === "hot")} options={[{ v: "hot", l: "Hot / humid" }, { v: "mild", l: "Mild / AC" }]} />
        </>
      }
      result={
        <div className="flex items-center gap-6">
          <div className="relative h-44 w-24 shrink-0 overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-white/25 bg-black/30">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500 to-sky-300/80 transition-all duration-700" style={{ height: `${fill}%` }} />
          </div>
          <div className="flex-1 space-y-3">
            <Big value={r.litres} unit="L" label="Water per day" />
            <p className="text-center text-sm text-white/65">
              ≈ <strong className="text-white">{r.glasses}</strong> glasses of 250 ml
            </p>
          </div>
        </div>
      }
    />
  );
}

function HeartCalc() {
  const [age, setAge] = useState(30);
  const [rest, setRest] = useState(70);
  const r = heartRateZones(age, rest);
  const colors = ["#6ea8fe", "#34d399", "#fbbf24", "#fb923c", "#e8394b"];
  return (
    <Layout
      inputs={
        <>
          <Slider label="Age" value={age} onChange={setAge} min={15} max={85} unit="yrs" />
          <Slider label="Resting heart rate" value={rest} onChange={setRest} min={40} max={100} unit="bpm" />
        </>
      }
      result={
        <>
          <Big value={r.max} unit="bpm" label={`Max heart rate · ${r.method}`} />
          <ul className="space-y-2">
            {r.zones.map((z, i) => (
              <li key={z.zone} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-black" style={{ background: colors[i] }}>
                  {z.zone}
                </span>
                <span className="flex-1 text-sm text-white/75">{z.name}</span>
                <span className="font-semibold text-white">
                  {z.low}–{z.high}
                </span>
              </li>
            ))}
          </ul>
        </>
      }
    />
  );
}

function IdrsCalc() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(38);
  const [waist, setWaist] = useState(92);
  const [act, setAct] = useState<ActivityIdrs>("mild");
  const [fam, setFam] = useState<FamilyHistory>("none");
  const r = idrs(sex, age, waist, act, fam);
  const color = r.risk === "High" ? "#e8394b" : r.risk === "Moderate" ? "#fbbf24" : "#34d399";
  return (
    <Layout
      inputs={
        <>
          <Toggle label="Sex" value={sex} onChange={setSex} options={SEX_OPTS} />
          <Slider label="Age" value={age} onChange={setAge} min={18} max={85} unit="yrs" />
          <Slider label="Waist" value={waist} onChange={setWaist} min={55} max={150} unit="cm" />
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Physical activity</span>
            <select value={act} onChange={(e) => setAct(e.target.value as ActivityIdrs)} className="field">
              <option value="vigorous">Vigorous exercise or strenuous work</option>
              <option value="moderate">Moderate exercise or work</option>
              <option value="mild">Mild exercise or work</option>
              <option value="sedentary">No exercise, sedentary work</option>
            </select>
          </label>
          <Toggle label="Parents with diabetes" value={fam} onChange={setFam} options={[{ v: "none", l: "Neither" }, { v: "one", l: "One" }, { v: "both", l: "Both" }]} />
        </>
      }
      result={
        <>
          <Gauge value={r.score} min={0} max={100} bands={[{ to: 30, color: "#34d399", label: "Low" }, { to: 60, color: "#fbbf24", label: "Moderate" }, { to: 100, color: "#e8394b", label: "High" }]} />
          <div className="grid grid-cols-2 gap-3">
            <Big value={r.score} label="IDRS score / 100" />
            <div className="rounded-2xl bg-black/35 p-4 text-center ring-1 ring-white/10">
              <div className="font-display text-3xl" style={{ color }}>{r.risk}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/55">Risk</div>
            </div>
          </div>
          <p className="text-center text-xs text-white/55">
            Age {r.parts.age} · Waist {r.parts.waist} · Activity {r.parts.activity} · Family {r.parts.family}. Only activity and waist are in your control — both improve with training.
          </p>
        </>
      }
    />
  );
}

function WhtrCalc() {
  const [waist, setWaist] = useState(86);
  const [h, setH] = useState(172);
  const r = waistToHeight(waist, h);
  return (
    <Layout
      inputs={
        <>
          <Slider label="Waist (at navel)" value={waist} onChange={setWaist} min={50} max={160} step={0.5} unit="cm" />
          <Slider label="Height" value={h} onChange={setH} min={120} max={220} unit="cm" />
        </>
      }
      result={
        <>
          <Gauge value={r.ratio} min={0.3} max={0.8} bands={[{ to: 0.4, color: "#6ea8fe", label: "Lean" }, { to: 0.5, color: "#34d399", label: "Healthy" }, { to: 0.6, color: "#fbbf24", label: "Increased" }, { to: 0.8, color: "#e8394b", label: "High" }]} />
          <div className="grid grid-cols-2 gap-3">
            <Big value={r.ratio.toFixed(2)} label="Waist ÷ height" />
            <Big value={r.category} label="Category" tone="white" />
          </div>
          <p className="text-center text-sm text-white/65">
            Keep your waist under <strong className="text-white">{r.targetWaist} cm</strong> (half your height).
          </p>
        </>
      }
    />
  );
}

function FastingCalc() {
  const [proto, setProto] = useState<(typeof FAST_PROTOCOLS)[number]["id"]>("16:8");
  const [first, setFirst] = useState("12:00");
  const fast = FAST_PROTOCOLS.find((p) => p.id === proto)!.fast;
  const r = fastingWindow(first, fast);
  const startPct = (() => {
    const [h, m] = first.split(":").map(Number);
    return ((h * 60 + m) / 1440) * 100;
  })();
  const eatPct = (r.eatingHours / 24) * 100;
  return (
    <Layout
      inputs={
        <>
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Protocol</span>
            <select value={proto} onChange={(e) => setProto(e.target.value as typeof proto)} className="field">
              {FAST_PROTOCOLS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">First meal at</span>
            <input type="time" value={first} onChange={(e) => e.target.value && setFirst(e.target.value)} className="field" />
          </label>
        </>
      }
      result={
        <>
          <div className="relative h-8 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="absolute inset-y-0 bg-brand" style={{ left: `${startPct}%`, width: `${Math.min(eatPct, 100 - startPct)}%` }} />
            {startPct + eatPct > 100 && <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${startPct + eatPct - 100}%` }} />}
          </div>
          <div className="flex justify-between text-[10px] text-white/40">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Big value={r.eatFrom} label="Start eating" tone="white" />
            <Big value={r.eatUntil} label="Stop eating" tone="white" />
          </div>
          <p className="text-center text-sm text-white/70">
            Best workout time: <strong className="text-brand">{r.bestTraining}</strong>
          </p>
        </>
      }
    />
  );
}

function Layout({ inputs, result }: { inputs: ReactNode; result: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5">{inputs}</div>
      <div className="space-y-4 rounded-2xl bg-gradient-to-b from-brand/10 to-transparent p-4 ring-1 ring-brand/25" aria-live="polite">
        {result}
      </div>
    </div>
  );
}

const MAP: Record<CalculatorKey, () => ReactNode> = {
  bmi: BmiCalc,
  tdee: TdeeCalc,
  "body-fat": BodyFatCalc,
  "one-rep-max": OneRmCalc,
  macro: MacroCalc,
  "ideal-weight": IdealCalc,
  water: WaterCalc,
  "heart-rate": HeartCalc,
  idrs: IdrsCalc,
  whtr: WhtrCalc,
  fasting: FastingCalc,
};

export function Calculator({ calcKey, embedded = false }: { calcKey: string; embedded?: boolean }) {
  const meta = calculatorByKey(calcKey);
  const Comp = MAP[calcKey as CalculatorKey];
  if (!meta || !Comp) return null;
  return (
    <section className="glass brand-border my-8 rounded-3xl p-5 sm:p-7" aria-label={meta.title}>
      {embedded && (
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15">
              <Icon name={meta.icon} className="h-5 w-5 text-brand" />
            </span>
            <span className="font-display text-xl text-white">{meta.title}</span>
          </div>
          <Link href={`/tools/${meta.slug}`} className="hidden text-sm text-brand underline-offset-4 hover:underline sm:block">
            Open full tool →
          </Link>
        </header>
      )}
      <Comp />
    </section>
  );
}
