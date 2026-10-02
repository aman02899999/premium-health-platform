"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DateField, Note, NumField, Panel, Segmented, SelectField, Stat, fmtDate } from "@/health/components/calc-ui";
import {
  addDays, bmi, bmiAsian, bmiWho, bodyFatCategory, bodyFatNavy, caloriePlan, cmFromFeetInches, cycleIsTypical, daysBetween, dueDate,
  feetInchesFromCm, gestationalAge, healthyRange, isoDate, kgFromLb, kgToHealthy, milestoneDates, parseDate, predictCycles, todayUtc,
  type DueDateMethod, type Goal,
} from "@/health/lib/calculators";
import { TDEE_FACTORS } from "@/health/lib/med-accuracy";
import { cn } from "@/health/lib/format";

const noSubscribe = () => () => {};
/** Today's date on the client only (null during SSR), so static pages never show a stale build-time date. */
function useToday(): Date | null {
  const iso = useSyncExternalStore(noSubscribe, () => isoDate(todayUtc()), () => null);
  return iso ? parseDate(iso) : null;
}

/** Height + weight inputs with a metric / imperial switch; always reports cm and kg. */
function BodyInputs({ heightCm, setHeightCm, weightKg, setWeightKg }: { heightCm: number; setHeightCm: (n: number) => void; weightKg: number; setWeightKg: (n: number) => void }) {
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const fi = feetInchesFromCm(heightCm);
  return (
    <div className="space-y-3">
      <Segmented label="Units" value={units} onChange={setUnits} options={[{ value: "metric", label: "cm · kg" }, { value: "imperial", label: "ft · lb" }]} />
      {units === "metric" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Height" unit="cm" value={heightCm} onChange={setHeightCm} min={90} max={230} />
          <NumField label="Weight" unit="kg" value={weightKg} onChange={setWeightKg} min={20} max={300} step={0.1} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Feet" value={fi.ft} onChange={(ft) => setHeightCm(Math.round(cmFromFeetInches(ft, fi.inch)))} min={3} max={7} />
          <NumField label="Inches" value={fi.inch} onChange={(inch) => setHeightCm(Math.round(cmFromFeetInches(fi.ft, inch)))} min={0} max={11} />
          <NumField label="Weight" unit="lb" value={Math.round(weightKg / 0.45359237)} onChange={(lb) => setWeightKg(Math.round(kgFromLb(lb) * 10) / 10)} min={44} max={660} />
        </div>
      )}
    </div>
  );
}

// ───────────────────────── BMI ─────────────────────────

export function BmiTool() {
  const [h, setH] = useState(168);
  const [w, setW] = useState(70);
  const [age, setAge] = useState(30);
  const b = bmi(w, h);
  const asian = bmiAsian(b);
  const who = bmiWho(b);
  const r = healthyRange(h);
  const gap = kgToHealthy(w, h);
  // Position on a 15–40 scale for the gauge.
  const pos = Math.min(100, Math.max(0, ((b - 15) / 25) * 100));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Your details">
        <div className="space-y-3">
          <BodyInputs heightCm={h} setHeightCm={setH} weightKg={w} setWeightKg={setW} />
          <NumField label="Age" unit="years" value={age} onChange={setAge} min={2} max={110} />
        </div>
      </Panel>
      <div className="space-y-4" aria-live="polite">
        {age < 18 ? (
          <Note tone="warn">Adult BMI categories don&apos;t apply under 18 — children are assessed with BMI-for-age percentiles. Use the <Link href="/health/child-growth" className="font-bold underline">child growth tool</Link>.</Note>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Your BMI" value={Number.isFinite(b) ? b.toFixed(1) : "—"} sub="kg/m²" tone={asian.tone} />
          <Stat label="Indian / Asian scale" value={asian.label} sub="18.5–22.9 healthy" tone={asian.tone} />
          <Stat label="WHO international" value={who.label} sub="18.5–24.9 normal" tone={who.tone} />
        </div>
        <Panel>
          <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b 0%,#f59e0b 14%,#10b981 14%,#10b981 31.6%,#f59e0b 31.6%,#f59e0b 39.6%,#f43f5e 39.6%)" }} aria-hidden>
            <span className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded bg-stone-900 ring-2 ring-white dark:bg-white dark:ring-stone-900" style={{ left: `${pos}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-stone-500"><span>15</span><span>18.5</span><span>23</span><span>25</span><span>30</span><span>40</span></div>
          <p className="mt-4 text-sm">Healthy weight for <strong>{h} cm</strong> on the Indian scale: <strong>{r.min.toFixed(1)}–{r.max.toFixed(1)} kg</strong>.</p>
          <p className="mt-1 text-sm">
            {gap > 0 ? <>You are <strong>{gap.toFixed(1)} kg</strong> above that range. At a steady 0.25–0.5 kg a week, that is about <strong>{Math.ceil(gap / 0.5)}–{Math.ceil(gap / 0.25)} weeks</strong>.</> : gap < 0 ? <>You are <strong>{Math.abs(gap).toFixed(1)} kg</strong> below that range — worth discussing with a doctor if it&apos;s unplanned.</> : <>You are inside the healthy range. Keep it with regular activity and balanced meals.</>}
          </p>
        </Panel>
        {b >= 23 && age >= 18 && (
          <Note tone="warn">Indians develop diabetes and heart disease at lower BMIs than Europeans. Check your waist too: above <strong>90 cm (men) or 80 cm (women)</strong> adds risk at any BMI. Try the <Link href="/health/india-risk" className="font-bold underline">diabetes risk score</Link> and the <Link href="/health/health-calculators/calorie-calculator" className="font-bold underline">calorie calculator</Link>.</Note>
        )}
        <p className="text-xs text-stone-500">BMI doesn&apos;t separate muscle from fat — very muscular people can read &ldquo;overweight&rdquo;. For a closer look, use the <Link href="/health/health-calculators/body-fat-calculator" className="underline">body fat calculator</Link>.</p>
      </div>
    </div>
  );
}

// ─────────────────── Pregnancy due date ───────────────────

const METHOD_LABEL: Record<DueDateMethod, string> = { lmp: "First day of last period", conception: "Conception date", ivf5: "IVF — day-5 transfer", ivf3: "IVF — day-3 transfer" };

export function DueDateTool() {
  const today = useToday();
  const [method, setMethod] = useState<DueDateMethod>("lmp");
  const [picked, setDate] = useState("");
  const [cycle, setCycle] = useState(28);
  // Until the user picks a date, show an example 10 weeks ago.
  const date = picked || (today ? isoDate(addDays(today, -70)) : "");
  const start = parseDate(date);
  const due = start ? dueDate(method, start, cycle) : null;
  const ga = due && today ? gestationalAge(due, today) : null;
  const milestones = due ? milestoneDates(due) : [];
  const tooOld = ga && ga.days > 42 * 7;
  const future = ga && ga.days < 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Your details">
        <div className="space-y-3">
          <SelectField label="Calculate from" value={method} onChange={setMethod} options={(Object.keys(METHOD_LABEL) as DueDateMethod[]).map((m) => ({ value: m, label: METHOD_LABEL[m] }))} />
          <DateField label={METHOD_LABEL[method]} value={date} onChange={setDate} max={today ? isoDate(today) : undefined} />
          {method === "lmp" && <NumField label="Usual cycle length" unit="days" value={cycle} onChange={setCycle} min={21} max={45} hint="28 if you're not sure" />}
        </div>
      </Panel>
      <div className="space-y-4" aria-live="polite">
        {!due || !today ? (
          <Panel><p className="text-sm text-stone-500">Pick a date to see your due date.</p></Panel>
        ) : future ? (
          <Note tone="warn">That date is in the future — pick the date it actually happened.</Note>
        ) : tooOld ? (
          <Note tone="warn">That date is more than 42 weeks ago. Check the date, or if your baby is already born, this calculator no longer applies.</Note>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Estimated due date" value={fmtDate(due, false)} sub={fmtDate(due).split(",")[0]} tone="ok" />
              <Stat label="You are" value={`${ga!.weeks}w ${ga!.rem}d`} sub={`Trimester ${ga!.trimester}`} />
              <Stat label="Days to go" value={Math.max(0, ga!.daysToGo)} sub={`${Math.round((ga!.days / 280) * 100)}% of the way`} />
            </div>
            <Panel>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800" aria-hidden>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(100, (ga!.days / 280) * 100)}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-stone-500"><span>Week 0</span><span>T2 · week 14</span><span>T3 · week 28</span><span>Week 40</span></div>
              <p className="mt-3 text-xs text-stone-500">Only about 4% of babies arrive on the due date; most come between 37 and 42 weeks. An early ultrasound gives the most accurate date — if it differs from this one, follow your doctor.</p>
            </Panel>
            <Panel title="Your antenatal checklist">
              <ol className="space-y-2.5">
                {milestones.map((m) => {
                  const done = daysBetween(m.end, today) > 0;
                  const now = !done && daysBetween(m.start, today) >= 0;
                  return (
                    <li key={m.title} className={cn("rounded-2xl border p-3", now ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" : "border-stone-200 dark:border-stone-700", done && "opacity-60")}>
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm font-bold">{m.title}<span className="text-xs font-semibold text-stone-500">{fmtDate(m.start, false)} – {fmtDate(m.end, false)}{now ? " · now" : done ? " · passed" : ""}</span></p>
                      <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">{m.note}</p>
                    </li>
                  );
                })}
              </ol>
            </Panel>
            <Note tone="alert">Go to hospital straight away for bleeding, severe headache or blurred vision, fits, high fever, leaking fluid, severe belly pain, or if the baby moves less than usual.</Note>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Period & ovulation ───────────────────

export function OvulationTool() {
  const today = useToday();
  const [picked, setLast] = useState("");
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(5);
  const [luteal, setLuteal] = useState(14);
  const last = picked || (today ? isoDate(addDays(today, -10)) : "");
  const start = parseDate(last);
  const cycles = start ? predictCycles(start, cycle, Math.min(period, cycle - 1), Math.min(luteal, cycle - 7), 4) : [];
  // Skip cycles that already ended so "next" means next.
  const upcoming = today ? cycles.filter((c) => daysBetween(today, c.nextPeriod) > 0).slice(0, 3) : cycles.slice(0, 3);
  const cur = upcoming[0];
  const phase = cur && today ? (daysBetween(cur.periodStart, today) >= 0 && daysBetween(today, cur.periodEnd) >= 0 ? "Period" : daysBetween(cur.fertileStart, today) >= 0 && daysBetween(today, cur.fertileEnd) >= 0 ? "Fertile window" : daysBetween(today, cur.fertileStart) > 0 ? "Before fertile window" : "After ovulation") : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Your cycle">
        <div className="space-y-3">
          <DateField label="First day of your last period" value={last} onChange={setLast} max={today ? isoDate(today) : undefined} />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Cycle length" unit="days" value={cycle} onChange={setCycle} min={20} max={45} hint="Day 1 to next day 1" />
            <NumField label="Period length" unit="days" value={period} onChange={setPeriod} min={2} max={10} />
          </div>
          <NumField label="Luteal phase" unit="days" value={luteal} onChange={setLuteal} min={10} max={16} hint="Leave at 14 unless you track ovulation" />
        </div>
      </Panel>
      <div className="space-y-4" aria-live="polite">
        {!cur || !today ? (
          <Panel><p className="text-sm text-stone-500">Pick the first day of your last period.</p></Panel>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Next period" value={fmtDate(cur.nextPeriod, false)} sub={`in ${daysBetween(today, cur.nextPeriod)} days`} />
              <Stat label="Fertile window" value={`${fmtDate(cur.fertileStart, false).replace(/ \d{4}$/, "")} – ${fmtDate(cur.fertileEnd, false).replace(/ \d{4}$/, "")}`} sub="Best chance of pregnancy" tone="ok" />
              <Stat label="Today" value={phase} sub={`Cycle day ${daysBetween(cur.periodStart, today) + 1}`} />
            </div>
            {!cycleIsTypical(cycle) && <Note tone="warn">Cycles shorter than 21 or longer than 35 days are worth discussing with a gynaecologist — they can be a sign of PCOS or thyroid problems, and make predictions less reliable. See our <Link href="/health/womens-health" className="font-bold underline">women&apos;s health guide</Link>.</Note>}
            <Panel title="Next 3 cycles">
              <div className="space-y-3">
                {upcoming.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-stone-200 p-3 dark:border-stone-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Cycle {i + 1}</p>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                      <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />Period {fmtDate(c.periodStart, false)}</p>
                      <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Fertile {fmtDate(c.fertileStart, false).replace(/ \d{4}$/, "")}–{fmtDate(c.fertileEnd, false).replace(/ \d{4}$/, "")}</p>
                      <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />Ovulation ~{fmtDate(c.ovulation, false).replace(/ \d{4}$/, "")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Note tone="warn">This is an estimate from the calendar. <strong>Don&apos;t use it as contraception</strong> — ovulation shifts with stress, illness and travel. Ovulation test strips or tracking body temperature are more accurate.</Note>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Calories & macros ───────────────────

const GOALS: { value: Goal; label: string }[] = [
  { value: "lose-0.5", label: "Lose 0.5 kg/week" },
  { value: "lose-0.25", label: "Lose 0.25 kg/week" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain-0.25", label: "Gain 0.25 kg/week (lean)" },
];

export function CalorieTool() {
  const [h, setH] = useState(168);
  const [w, setW] = useState(70);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(1.375);
  const [goal, setGoal] = useState<Goal>("lose-0.5");
  const p = caloriePlan({ weightKg: w, heightCm: h, age, sex, activity, goal });
  const total = p.proteinG * 4 + p.fatG * 9 + p.carbG * 4;
  const pct = (g: number, k: number) => Math.round(((g * k) / total) * 100);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Your details">
        <div className="space-y-3">
          <Segmented label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <BodyInputs heightCm={h} setHeightCm={setH} weightKg={w} setWeightKg={setW} />
          <NumField label="Age" unit="years" value={age} onChange={setAge} min={18} max={100} />
          <SelectField label="Activity" value={activity} onChange={setActivity} options={TDEE_FACTORS.map((f) => ({ value: f.value, label: f.label }))} />
          <SelectField label="Goal" value={goal} onChange={setGoal} options={GOALS} />
        </div>
      </Panel>
      <div className="space-y-4" aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Daily target" value={`${p.target} kcal`} sub={GOALS.find((g) => g.value === goal)!.label} tone="ok" />
          <Stat label="Maintenance (TDEE)" value={`${p.tdee} kcal`} sub="Weight stays the same" />
          <Stat label="BMR" value={`${p.bmr} kcal`} sub="Burned at complete rest" />
        </div>
        {p.floored && <Note tone="warn">Your goal would go below {p.floor} kcal a day, so we&apos;ve held it there. Eating less than this makes it hard to get enough protein, iron and calcium — lose weight more slowly instead, or get a dietitian&apos;s plan.</Note>}
        <Panel title="Your macros">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
            <div className="bg-emerald-500" style={{ width: `${pct(p.proteinG, 4)}%` }} />
            <div className="bg-amber-400" style={{ width: `${pct(p.carbG, 4)}%` }} />
            <div className="bg-sky-500" style={{ width: `${pct(p.fatG, 9)}%` }} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Protein" value={`${p.proteinG} g`} sub={`${pct(p.proteinG, 4)}% · ~${Math.round(p.proteinG / 3)} g per meal`} />
            <Stat label="Carbs" value={`${p.carbG} g`} sub={`${pct(p.carbG, 4)}% · roti, rice, millets, fruit`} />
            <Stat label="Fat" value={`${p.fatG} g`} sub={`${pct(p.fatG, 9)}% · ~${Math.round(p.fatG / 5)} tsp oil/ghee total`} />
          </div>
          <p className="mt-4 text-xs text-stone-500">Protein sources that fit Indian meals: dal (1 katori ≈ 7 g), paneer (100 g ≈ 18 g), curd (1 katori ≈ 5 g), eggs (1 ≈ 6 g), chicken (100 g ≈ 27 g), soya chunks (30 g dry ≈ 15 g).</p>
        </Panel>
        <Note tone="warn">Diabetes, kidney disease, pregnancy or under 18? Get a plan from your doctor or a dietitian — these targets aren&apos;t designed for you.</Note>
      </div>
    </div>
  );
}

// ─────────────────── Body fat ───────────────────

export function BodyFatTool() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [h, setH] = useState(170);
  const [neck, setNeck] = useState(37);
  const [waist, setWaist] = useState(88);
  const [hip, setHip] = useState(98);
  const [w, setW] = useState(72);
  const pct = bodyFatNavy(sex, h, neck, waist, hip);
  const valid = Number.isFinite(pct) && pct > 0 && pct < 70;
  const cat = valid ? bodyFatCategory(sex, pct) : null;
  const fatKg = valid ? (w * pct) / 100 : NaN;
  const whtr = waist / h;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Panel title="Measurements">
        <div className="space-y-3">
          <Segmented label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Height" unit="cm" value={h} onChange={setH} min={120} max={230} />
            <NumField label="Weight" unit="kg" value={w} onChange={setW} min={30} max={300} step={0.1} />
            <NumField label="Neck" unit="cm" value={neck} onChange={setNeck} min={20} max={70} step={0.5} hint="Just below the Adam's apple" />
            <NumField label="Waist" unit="cm" value={waist} onChange={setWaist} min={40} max={200} step={0.5} hint={sex === "male" ? "At the navel" : "Narrowest point"} />
            {sex === "female" && <NumField label="Hip" unit="cm" value={hip} onChange={setHip} min={50} max={200} step={0.5} hint="Widest point" />}
          </div>
          <p className="text-[11px] text-stone-400">Measure with a soft tape, relaxed, after breathing out. Take each twice and use the average.</p>
        </div>
      </Panel>
      <div className="space-y-4" aria-live="polite">
        {!valid ? (
          <Note tone="warn">Check your measurements — your waist{sex === "female" ? " plus hip" : ""} must be larger than your neck.</Note>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Body fat" value={`${pct.toFixed(1)}%`} sub="US Navy method" tone={cat!.tone} />
              <Stat label="Category" value={cat!.label} sub="American Council on Exercise" tone={cat!.tone} />
              <Stat label="Fat / lean mass" value={`${fatKg.toFixed(1)} / ${(w - fatKg).toFixed(1)} kg`} />
            </div>
            <Panel title="Where you sit">
              <div className="grid grid-cols-5 gap-1 text-center text-[11px] font-semibold">
                {(sex === "male" ? [["Essential", "2–5%"], ["Athletes", "6–13%"], ["Fitness", "14–17%"], ["Average", "18–24%"], ["Obese", "25%+"]] : [["Essential", "10–13%"], ["Athletes", "14–20%"], ["Fitness", "21–24%"], ["Average", "25–31%"], ["Obese", "32%+"]]).map(([l, r]) => (
                  <div key={l} className={cn("rounded-xl p-2", cat!.label.startsWith(l) || (l === "Obese" && cat!.label.startsWith("Obese")) ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300")}>{l}<br /><span className="font-normal">{r}</span></div>
                ))}
              </div>
              <p className="mt-4 text-sm">Waist-to-height ratio: <strong>{whtr.toFixed(2)}</strong> — {whtr < 0.5 ? "under 0.5, a healthy sign." : "0.5 or above, linked to higher diabetes and heart risk even at a normal BMI."}</p>
            </Panel>
            <p className="text-xs text-stone-500">The Navy formula is usually within 3–4% of a DEXA scan. Use it to track change over time, measured the same way each time — not as an exact number.</p>
          </>
        )}
      </div>
    </div>
  );
}
