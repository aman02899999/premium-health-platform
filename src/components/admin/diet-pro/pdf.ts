"use client";

// Branded client PDF for Diet Pro, built in the browser (jsPDF + AutoTable, loaded on demand).
import type { Targets } from "@/lib/diet-pro/engine";
import type { Note, TrainingDay } from "@/lib/diet-pro/guidance";
import type { PlannedDay } from "@/lib/diet-pro/meals";
import type { ClientProfile } from "@/lib/diet-pro/types";

export type PdfBusiness = { name: string; phone: string; address: string; instagram: string; site: string };

type Input = {
  client: ClientProfile;
  t: Targets;
  days: PlannedDay[];
  training: TrainingDay[];
  supplements: Note[];
  lifestyle: Note[];
  business: PdfBusiness;
  coach: string;
  coachNote: string;
  bodyImage: string | null;
  labels: Record<string, string>;
};

const NAVY: [number, number, number] = [4, 70, 109];
const RED: [number, number, number] = [232, 57, 75];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

/** Helvetica in jsPDF is WinAnsi: replace glyphs it cannot draw. */
const t = (s: string) =>
  s
    .replace(/≈/g, "~")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/→/g, "->")
    .replace(/[√]/g, "sqrt")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₹/g, "Rs ")
    .replace(/[^\x00-\xFF–—•·×½…]/g, "");

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const n0 = (v: number) => Math.round(v).toLocaleString("en-IN");
const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export async function downloadPlanPdf(input: Input) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { client: c, t: T, business: B } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const logo = await toDataUrl("/brand/logo-full.png");
  const mark = await toDataUrl("/brand/logo-mark.png");
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const header = (title: string) => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 16, "F");
    doc.setFillColor(...RED);
    doc.rect(0, 16, W, 1.2, "F");
    if (mark) doc.addImage(mark, "PNG", M, 3, 18, 10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t(B.name), M + 21, 9.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(t(title), W - M, 9.2, { align: "right" });
  };
  const section = (y: number, title: string) => {
    doc.setFillColor(...RED);
    doc.rect(M, y - 4, 1.4, 5.5, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.text(t(title), M + 4, y);
    return y + 4;
  };
  const tableTheme = {
    styles: { font: "helvetica", fontSize: 8.4, cellPadding: 1.6, textColor: INK, lineColor: [226, 232, 240] as [number, number, number], lineWidth: 0.15 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const },
    alternateRowStyles: { fillColor: [246, 248, 251] as [number, number, number] },
    margin: { left: M, right: M, top: 22, bottom: 16 },
  };
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // ───── Cover / summary ─────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 58, "F");
  doc.setFillColor(...RED);
  doc.rect(0, 58, W, 2, "F");
  if (logo) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 8, 44, 40, 3, 3, "F");
    doc.addImage(logo, "PNG", M + 2, 10, 40, 36);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Personal Nutrition &", M + 52, 22);
  doc.text("Training Plan", M + 52, 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t(`Prepared for ${c.name || "Client"}`), M + 52, 40);
  doc.setFontSize(8.5);
  doc.setTextColor(200, 220, 235);
  doc.text(t(`${today}  ·  Coach ${input.coach}  ·  ${B.name}`), M + 52, 46);

  let y = 70;
  y = section(y, "Client profile");
  const profileRows = [
    ["Age / sex", `${c.age} y · ${c.sex === "male" ? "Male" : "Female"}`, "Goal", input.labels.goal],
    ["Height / weight", `${c.heightCm} cm · ${c.weightKg} kg`, "Target weight", c.targetWeightKg ? `${c.targetWeightKg} kg` : "—"],
    ["Diet", input.labels.diet, "Style", input.labels.style],
    ["Activity", input.labels.activity, "Training", c.trainingDays ? `${c.trainingDays} days/week (${c.setting})` : "Not training yet"],
    ["Meals/day", String(c.mealsPerDay), "Allergies", c.allergies.length ? c.allergies.join(", ") : "None reported"],
  ];
  const bodyW = input.bodyImage ? 52 : 0;
  autoTable(doc, { ...tableTheme, startY: y, body: profileRows.map((r) => r.map(t)), theme: "grid", margin: { ...tableTheme.margin, right: M + bodyW + 3 }, columnStyles: { 0: { fontStyle: "bold", textColor: NAVY }, 2: { fontStyle: "bold", textColor: NAVY } } });
  y = lastY() + 8;

  if (input.bodyImage) {
    doc.setFillColor(10, 26, 42);
    doc.roundedRect(W - M - bodyW, 66, bodyW, 92, 3, 3, "F");
    doc.addImage(input.bodyImage, "PNG", W - M - bodyW + 2, 68, bodyW - 4, 80);
    doc.setFontSize(6.8);
    doc.setTextColor(200, 220, 235);
    doc.text("3D body map from tape measurements", W - M - bodyW / 2, 154, { align: "center" });
  }

  y = section(y, "Body analysis");
  const A = T.analysis;
  const bfMethod = A.bfMethod === "measured" ? "measured (DEXA/BIA/calliper)" : A.bfMethod === "navy" ? "US Navy tape method" : "BMI-based estimate (Deurenberg)";
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    margin: { ...tableTheme.margin, right: M + bodyW + 3 },
    head: [["Measure", "Result", "Meaning"]],
    body: [
      ["BMI", n1(A.bmi), `${A.bmiBand.label} (${c.bmiScale === "asian" ? "Asian" : "WHO"} cut-offs)`],
      ["Healthy weight", `${A.healthyRange.min}–${A.healthyRange.max} kg`, "BMI 18.5 to " + (c.bmiScale === "asian" ? "22.9" : "24.9")],
      ["Body fat", `${A.bodyFat} %`, `${A.bfBand.label} · ${bfMethod}`],
      ["Fat / lean mass", `${A.fatKg} kg / ${A.leanKg} kg`, "Lean = everything that is not fat"],
      ["FFMI", `${A.ffmi} (norm. ${A.ffmiNorm})`, "Lean mass per height²"],
      ...(A.whtr ? [["Waist ÷ height", String(A.whtr), A.whtrBand!.label]] : []),
      ...(A.whr ? [["Waist ÷ hip", String(A.whr), A.whrBand!.label]] : []),
      ...(A.waistBand ? [["Waist", `${c.m.waist} cm`, A.waistBand.label]] : []),
    ].map((r) => r.map(t)),
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 }, 1: { cellWidth: 32 } },
  });
  y = Math.max(lastY(), input.bodyImage ? 160 : 0) + 8;

  // Target tiles.
  y = section(y, "Daily targets");
  const tiles: [string, string, string][] = [
    ["Calories", `${n0(T.kcal)}`, "kcal/day"],
    ["Protein", `${T.protein} g`, `${T.proteinPerKg} g/kg`],
    ["Carbs", `${T.carb} g`, `${Math.round(((T.carb * 4) / T.kcal) * 100)} % energy`],
    ["Fat", `${T.fat} g`, `${Math.round(((T.fat * 9) / T.kcal) * 100)} % energy`],
    ["Fibre", `${T.fibre} g`, "14 g / 1000 kcal"],
    ["Water", `${T.waterRestL}–${T.waterTrainL} L`, "drinks, rest–training"],
  ];
  const tw = (W - 2 * M - 5 * 3) / 6;
  tiles.forEach(([label, value, sub], i) => {
    const x = M + i * (tw + 3);
    doc.setFillColor(i === 0 ? RED[0] : 241, i === 0 ? RED[1] : 245, i === 0 ? RED[2] : 249);
    doc.roundedRect(x, y, tw, 20, 2, 2, "F");
    doc.setTextColor(...(i === 0 ? ([255, 255, 255] as [number, number, number]) : MUTED));
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + tw / 2, y + 5, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(...(i === 0 ? ([255, 255, 255] as [number, number, number]) : NAVY));
    doc.text(t(value), x + tw / 2, y + 12, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...(i === 0 ? ([255, 230, 232] as [number, number, number]) : MUTED));
    doc.text(t(sub), x + tw / 2, y + 17, { align: "center" });
  });
  y += 27;
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  const energyLine = `Energy: BMR ${n0(T.bmr)} kcal (${T.bmrFormula}) × activity ${T.factor} = maintenance ${n0(T.tdee)} kcal. ${
    T.delta === 0 ? "Plan is at maintenance." : `${T.delta < 0 ? "Deficit" : "Surplus"} of ${n0(Math.abs(T.delta))} kcal/day ≈ ${Math.abs(T.weeklyKg)} kg per week.`
  }${T.weeksToGoal ? ` Target weight in about ${T.weeksToGoal} weeks at this rate (real progress slows as weight changes; we re-check every 2 weeks).` : ""}`;
  doc.text(doc.splitTextToSize(t(energyLine), W - 2 * M), M, y);
  y += 12;
  if (input.coachNote.trim()) {
    y = section(y, "Coach's note");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(t(input.coachNote.trim()), W - 2 * M);
    doc.text(lines, M, y + 1);
  }

  // ───── 7-day meal plan ─────
  for (const day of input.days) {
    doc.addPage();
    header(`Meal plan · Day ${day.day}`);
    let yy = section(26, `Day ${day.day}`);
    const body: (string | { content: string; colSpan?: number; styles?: Record<string, unknown> })[][] = [];
    for (const m of day.meals) {
      body.push([{ content: t(`${m.label} — ${m.template}`), colSpan: 6, styles: { fillColor: [232, 241, 248], textColor: NAVY, fontStyle: "bold" } }]);
      for (const it of m.items) body.push([t(it.food.name), t(it.label), n0(it.macro.kcal), n1(it.macro.p), n1(it.macro.c), n1(it.macro.f)]);
      body.push([{ content: "Meal total", styles: { fontStyle: "bold" } }, "", { content: n0(m.total.kcal), styles: { fontStyle: "bold" } }, { content: n1(m.total.p), styles: { fontStyle: "bold" } }, { content: n1(m.total.c), styles: { fontStyle: "bold" } }, { content: n1(m.total.f), styles: { fontStyle: "bold" } }]);
    }
    autoTable(doc, {
      ...tableTheme,
      startY: yy,
      head: [["Food", "Amount", "kcal", "Protein g", "Carbs g", "Fat g"]],
      body,
      foot: [
        ["Day total", "", n0(day.total.kcal), n1(day.total.p), n1(day.total.c), n1(day.total.f)],
        ["Target", "", n0(T.kcal), String(T.protein), String(T.carb), String(T.fat)],
      ],
      footStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
      showFoot: "lastPage",
      styles: { ...tableTheme.styles, fontSize: 7.8, cellPadding: 1.15 },
      columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 46 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
      didDrawPage: () => header(`Meal plan · Day ${day.day}`),
    });
    yy = lastY() + 5;
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      t(`Fibre ${n0(day.total.fib)} g (target ${T.fibre}) · Calcium ${n0(day.total.ca)} mg (RDA ${T.calciumMg}) · Iron ${n1(day.total.fe)} mg (RDA ${T.ironMg}) · Potassium ${n0(day.total.k)} mg · Sodium from foods ${n0(day.total.na)} mg + salt in cooking (keep total under ${T.sodiumMaxMg} mg).`),
      M,
      yy,
      { maxWidth: W - 2 * M },
    );
  }

  // ───── Training ─────
  doc.addPage();
  header("Training plan");
  y = section(26, "Training plan");
  if (input.training.length) {
    for (const d of input.training) {
      autoTable(doc, {
        ...tableTheme,
        startY: y,
        head: [[t(`${d.title} · ${d.focus}`), "Sets", "Reps", "Rest"]],
        body: d.items.map((i) => [t(i.name), String(i.sets), t(i.reps), `${i.rest} s`]),
        ...(d.finisher ? { foot: [[{ content: t(d.finisher), colSpan: 4 }]], footStyles: { fillColor: [253, 236, 238], textColor: RED, fontStyle: "bold" } } : {}),
        columnStyles: { 1: { cellWidth: 16, halign: "center" }, 2: { cellWidth: 24, halign: "center" }, 3: { cellWidth: 18, halign: "center" } },
        didDrawPage: () => header("Training plan"),
      });
      y = lastY() + 5;
    }
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t("Warm up 5–10 min before every session. Add weight or reps when every set reaches the top of the rep range with good form."), M, Math.min(y + 2, H - 20), { maxWidth: W - 2 * M });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(t("Start with 150 min/week of brisk walking and 2 full-body strength sessions; your coach will build the gym plan at the next review."), M, y + 2, { maxWidth: W - 2 * M });
  }

  // ───── Supplements, safety, habits ─────
  doc.addPage();
  header("Guidance");
  y = section(26, "Medical & safety notes");
  const warn = T.warnings.length ? T.warnings.map((w) => [w.tone === "alert" ? "Important" : "Note", t(w.text)]) : [["—", "No medical flags reported. Tell your coach about any condition or medicine change."]];
  autoTable(doc, { ...tableTheme, startY: y, body: warn, columnStyles: { 0: { cellWidth: 22, fontStyle: "bold", textColor: RED } }, didDrawPage: () => header("Guidance") });
  y = section(lastY() + 9, "Supplements (evidence-based, test first)");
  autoTable(doc, { ...tableTheme, startY: y, head: [["Supplement", "How", "Evidence"]], body: input.supplements.map((s) => [t(s.title), t(s.text), t(s.source)]), columnStyles: { 0: { cellWidth: 32, fontStyle: "bold" }, 2: { cellWidth: 50, textColor: MUTED, fontSize: 7.2 } }, didDrawPage: () => header("Guidance") });
  y = section(lastY() + 9, "Habits that make the plan work");
  autoTable(doc, { ...tableTheme, startY: y, body: input.lifestyle.map((s) => [t(s.title), t(s.text), t(s.source)]), columnStyles: { 0: { cellWidth: 26, fontStyle: "bold" }, 2: { cellWidth: 50, textColor: MUTED, fontSize: 7.2 } }, didDrawPage: () => header("Guidance") });

  // ───── Sources & disclaimer ─────
  doc.addPage();
  header("Method & sources");
  y = section(26, "How these numbers were calculated");
  const method = [
    ["Energy", "Mifflin-St Jeor (1990) resting energy, or Katch-McArdle when body fat is known, × activity factor. ~7,700 kcal per kg of weight change. Floors: 1,500 kcal men, 1,200 kcal women (NIH)."],
    ["Body fat", "Measured value if provided; otherwise U.S. Navy circumference equations (Hodgdon & Beckett, 1984); otherwise Deurenberg (1991) from BMI, age and sex."],
    ["BMI & waist", "Asian-Indian BMI cut-offs (WHO 2004; Misra et al. 2009); waist ≥90/80 cm (IDF South-Asian); waist-to-height ≥0.5 (NICE 2022); waist-to-hip (WHO 2008)."],
    ["Macros", "Protein 1.2–2.4 g/kg of reference weight (ISSN 2017); fat 20–40 % of energy by diet style (ICMR-NIN 2020; WHO); carbs fill the rest. Fibre 14 g per 1,000 kcal."],
    ["Food data", "IFCT 2017 — Indian Food Composition Tables, ICMR-National Institute of Nutrition, Hyderabad; and USDA FoodData Central (SR Legacy). Every food in the plan is weighed in the state shown (raw, dry or cooked)."],
    ["Meal plan", "Each meal's portions are solved to match its share of the day's protein, carbs and fat, then rounded to kitchen amounts. Totals shown are recalculated from the rounded amounts."],
  ];
  autoTable(doc, { ...tableTheme, startY: y, body: method.map((r) => r.map(t)), columnStyles: { 0: { cellWidth: 26, fontStyle: "bold", textColor: NAVY } } });
  y = lastY() + 10;
  doc.setFillColor(253, 236, 238);
  doc.roundedRect(M, y, W - 2 * M, 24, 2, 2, "F");
  doc.setFontSize(8.2);
  doc.setTextColor(...INK);
  doc.text(
    doc.splitTextToSize(
      t("This plan gives general fitness and nutrition guidance from your coach. It is not a medical diagnosis or treatment. If you are pregnant, breastfeeding, under 18, take medicines for diabetes, blood pressure or thyroid, or have kidney, liver or heart disease, follow your doctor's advice first. Stop and seek medical help for chest pain, fainting or unusual breathlessness."),
      W - 2 * M - 6,
    ),
    M + 3,
    y + 5,
  );

  // Footer + faint watermark on every page.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (mark && i > 1) {
      const g = doc.GState({ opacity: 0.05 });
      doc.setGState(g);
      doc.addImage(mark, "PNG", W / 2 - 45, H / 2 - 25, 90, 50);
      doc.setGState(doc.GState({ opacity: 1 }));
    }
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.4);
    doc.line(M, H - 11, W - M, H - 11);
    doc.setFontSize(7.2);
    doc.setTextColor(...MUTED);
    doc.text(t(`${B.name} · ${B.phone} · ${B.address}`), M, H - 7, { maxWidth: W - 2 * M - 30 });
    doc.text(`Page ${i} of ${pages}`, W - M, H - 7, { align: "right" });
    doc.text(t(`Confidential — prepared for ${c.name || "client"} · ${B.site}`), M, H - 3.8);
  }

  const safe = (c.name || "client").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  doc.save(`royal-fitness-plan-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
