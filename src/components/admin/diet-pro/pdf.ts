"use client";

// Branded client PDF for Diet Pro, built in the browser (jsPDF + AutoTable, loaded on demand).
import type { Targets } from "@/lib/diet-pro/engine";
import type { Note, TrainingDay } from "@/lib/diet-pro/guidance";
import { MEASURE_LEGEND, household, mealTime } from "@/lib/diet-pro/household";
import type { PlannedDay } from "@/lib/diet-pro/meals";
import type { ClientProfile } from "@/lib/diet-pro/types";

export type PdfBusiness = { name: string; phone: string; address: string; instagram: string; site: string };
/** Who designed the plan: printed on the cover, headers, footers, watermark and the signed coach card. */
export type PdfCoach = { name: string; title: string; experience: string; certification: string; photo: string };

type Input = {
  client: ClientProfile;
  t: Targets;
  days: PlannedDay[];
  training: TrainingDay[];
  supplements: Note[];
  lifestyle: Note[];
  business: PdfBusiness;
  coach: PdfCoach;
  coachNote: string;
  bodyImage: string | null;
  labels: Record<string, string>;
};

const NAVY: [number, number, number] = [4, 70, 109];
const RED: [number, number, number] = [232, 57, 75];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const GOLD: [number, number, number] = [176, 138, 62];
const GOLD_SOFT: [number, number, number] = [250, 245, 232];

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

/** Square photo → circular PNG (works for WebP/JPEG sources jsPDF can't embed directly). */
async function roundPhoto(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Trainer photos are full-length gym shots: zoom to head and shoulders, a little above centre.
    const side = Math.min(img.naturalWidth, img.naturalHeight) * 0.55;
    const sx = (img.naturalWidth - side) / 2;
    const sy = Math.min(img.naturalHeight - side, Math.max(0, img.naturalHeight * 0.42 - side / 2));
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** "royalfitness93_", "@x" or an instagram.com URL → "@handle". */
const igHandle = (v: string) => {
  const h = v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
  return h ? `@${h}` : "";
};

/** "Rice, white (raw)" → "rice"; "Hung curd / Greek yogurt (fat-free)" → "hung curd / Greek yogurt". */
const shortName = (name: string) => name.replace(/\s*\([^)]*\)/g, "").split(", ")[0].replace(/^\w/, (ch) => ch.toLowerCase());
const n0 = (v: number) => Math.round(v).toLocaleString("en-IN");
const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export async function downloadPlanPdf(input: Input) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { client: c, t: T, business: B, coach: K } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const BOTTOM = H - 18; // content must end above the footer
  const [logo, mark, photo] = await Promise.all([toDataUrl("/brand/logo-full.png"), toDataUrl("/brand/logo-mark.png"), roundPhoto(K.photo)]);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const today = fmtDate(new Date());
  const nextReview = fmtDate(new Date(Date.now() + 14 * 86_400_000));
  const coachName = `Coach ${K.name.trim().replace(/^coach\s+/i, "")}`;
  const credLine = [K.title.trim(), K.experience.trim() && `${K.experience.trim()} experience`].filter(Boolean).join(" · ");
  const years = K.experience.match(/\d+\+?/)?.[0] ?? "";
  const ig = igHandle(B.instagram);
  const clientName = c.name.trim() || "Client";
  doc.setProperties({ title: `Nutrition & training plan — ${clientName}`, subject: `Prepared by ${coachName}, ${K.title}`, author: `${coachName} · ${B.name}`, creator: B.name });

  /** Shorten a single line with an ellipsis so it never wraps into the next one. */
  const fit = (s: string, maxW: number) => {
    let out = t(s);
    if (doc.getTextWidth(out) <= maxW) return out;
    while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxW) out = out.slice(0, -1);
    return `${out.trimEnd()}…`;
  };

  const header = (title: string) => {
    const W = doc.internal.pageSize.getWidth(); // the weekly chart page is landscape
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 16, "F");
    doc.setFillColor(...RED);
    doc.rect(0, 16, W, 1.2, "F");
    if (mark) doc.addImage(mark, "PNG", M, 3, 22, 10); // logo-mark is 352×160
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t(B.name), M + 25, 9.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(t(title), W - M, 7.4, { align: "right" });
    doc.setFontSize(6.8);
    doc.setTextColor(214, 190, 140);
    doc.text(t(`${coachName} · ${K.title}`), W - M, 12.2, { align: "right" });
  };
  /** Start a new portrait page when fewer than `need` mm remain. */
  const ensure = (y: number, need: number, title: string) => {
    if (y + need <= BOTTOM) return y;
    doc.addPage("a4", "portrait");
    header(title);
    return 26;
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
    margin: { left: M, right: M, top: 22, bottom: 20 },
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
  doc.text(t(`Prepared for ${clientName}`), M + 52, 40);
  doc.setFontSize(8.5);
  doc.setTextColor(200, 220, 235);
  doc.text(t(`${today}  ·  ${B.name}`), M + 52, 46);

  // Credential strip: who designed this plan.
  {
    const top = 63;
    const h = 22;
    doc.setFillColor(...GOLD_SOFT);
    doc.roundedRect(M, top, W - 2 * M, h, 2.5, 2.5, "F");
    doc.setFillColor(...GOLD);
    doc.rect(M, top, 1.6, h, "F");
    let x = M + 6;
    if (photo) {
      doc.setFillColor(...GOLD);
      doc.circle(x + 8, top + h / 2, 8.6, "F");
      doc.addImage(photo, "PNG", x, top + h / 2 - 8, 16, 16);
      x += 20;
    }
    const textW = W - M - 30 - x;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(...GOLD);
    doc.text("YOUR PLAN IS DESIGNED BY", x, top + 5.6, { charSpace: 0.4 });
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(fit(coachName, textW), x, top + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...INK);
    doc.text(fit(credLine, textW), x, top + 16.6);
    if (K.certification.trim()) {
      doc.setFontSize(7.2);
      doc.setTextColor(...MUTED);
      doc.text(fit(K.certification.trim(), textW), x, top + 20.2);
    }
    if (years) {
      // Experience seal.
      const cx = W - M - 13;
      const cy = top + h / 2;
      doc.setFillColor(...GOLD);
      doc.circle(cx, cy, 9.4, "F");
      doc.setFillColor(...NAVY);
      doc.circle(cx, cy, 8.2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(years.length > 3 ? 10 : 12);
      doc.text(years, cx, cy + 0.6, { align: "center" });
      doc.setFontSize(5.2);
      doc.setTextColor(232, 210, 160);
      doc.text("YEARS", cx, cy + 4.4, { align: "center", charSpace: 0.3 });
    }
  }

  const DY = 22; // the credential strip pushes the cover content down
  let y = 70 + DY;
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
    doc.roundedRect(W - M - bodyW, 66 + DY, bodyW, 92, 3, 3, "F");
    doc.addImage(input.bodyImage, "PNG", W - M - bodyW + 2, 68 + DY, bodyW - 4, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(200, 220, 235);
    doc.text("3D body map from tape measurements", W - M - bodyW / 2, 154 + DY, { align: "center" });
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
  y = Math.max(lastY(), input.bodyImage ? 160 + DY : 0) + 8;

  // Target tiles.
  y = section(ensure(y, 48, "Your plan"), "Daily targets");
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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  const energyLine = `Energy: BMR ${n0(T.bmr)} kcal (${T.bmrFormula}) × activity ${T.factor} = maintenance ${n0(T.tdee)} kcal. ${
    T.weeklyKg === 0 ? "Plan is at maintenance." : `${T.delta < 0 ? "Deficit" : "Surplus"} of ${n0(Math.abs(T.delta))} kcal/day ≈ ${Math.abs(T.weeklyKg)} kg per week.`
  }${T.weeksToGoal ? ` Target weight in about ${T.weeksToGoal} weeks at this rate (real progress slows as weight changes; we re-check every 2 weeks).` : ""}`;
  const energy = doc.splitTextToSize(t(energyLine), W - 2 * M) as string[];
  y = ensure(y, energy.length * 3.8, "Your plan");
  doc.text(energy, M, y);
  y += energy.length * 3.8 + 6;
  if (input.coachNote.trim()) {
    y = section(ensure(y, 18, "Coach's note"), `A note from ${coachName}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(t(input.coachNote.trim()), W - 2 * M - 8) as string[];
    // Long notes continue on the next page instead of running into the footer.
    for (const line of lines) {
      if (y + 4.4 > BOTTOM) {
        doc.addPage("a4", "portrait");
        header("Coach's note");
        y = 28;
      }
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(line, M + 4, y + 1.5);
      y += 4.4;
    }
  }

  // ───── Week at a glance (the chart a client pins on the fridge) ─────
  const C = input.client;
  const whey = C.useWhey ? C.whey : undefined;
  const qty = (id: string, g: number, dish: string) => household(id, g, dish, whey).qty;
  doc.addPage("a4", "landscape");
  {
    const LW = doc.internal.pageSize.getWidth();
    header("Diet chart · week at a glance");
    let wy = section(26, "Your week at a glance");
    const first = input.days[0]?.meals ?? [];
    autoTable(doc, {
      ...tableTheme,
      startY: wy,
      head: [["Day", ...first.map((m) => t(`${m.label.replace(" snack", "")}\n${mealTime(m.label, C.wakeTime, C.mealsPerDay)}`))]],
      body: input.days.map((d) => [`Day ${d.day}`, ...d.meals.map((m) => t(`${m.template}\n${m.items.map((it) => `• ${qty(it.food.id, it.grams, m.template)} ${shortName(it.food.name)}`).join("\n")}`))]),
      styles: { ...tableTheme.styles, fontSize: 6.4, cellPadding: 1.1, valign: "top" },
      columnStyles: { 0: { cellWidth: 14, fontStyle: "bold", textColor: NAVY } },
      margin: { ...tableTheme.margin },
      tableWidth: LW - 2 * M,
      didDrawPage: () => header("Diet chart · week at a glance"),
    });
    wy = lastY() + 5;
    if (wy > doc.internal.pageSize.getHeight() - 26) {
      doc.addPage("a4", "landscape");
      header("Diet chart · week at a glance");
      wy = 26;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(t(`On waking (${mealTime("Wake", C.wakeTime)}): 1-2 glasses of water. Measures: ${MEASURE_LEGEND.join(" · ")}. Grains and dals are weighed raw; the cooked katori is a guide.`), M, wy, { maxWidth: LW - 2 * M });
  }

  // ───── 7-day meal plan ─────
  for (const day of input.days) {
    doc.addPage("a4", "portrait");
    header(`Meal plan · Day ${day.day}`);
    let yy = section(26, `Day ${day.day}`);
    const body: (string | { content: string; colSpan?: number; styles?: Record<string, unknown> })[][] = [];
    for (const m of day.meals) {
      body.push([{ content: t(`${mealTime(m.label, C.wakeTime, C.mealsPerDay)} · ${m.label} — ${m.template}`), colSpan: 6, styles: { fillColor: [232, 241, 248], textColor: NAVY, fontStyle: "bold" } }]);
      for (const it of m.items) body.push([t(it.food.name), t(`${qty(it.food.id, it.grams, m.template)} (${it.label})`), n0(it.macro.kcal), n1(it.macro.p), n1(it.macro.c), n1(it.macro.f)]);
      body.push([{ content: "Meal total", styles: { fontStyle: "bold" } }, "", { content: n0(m.total.kcal), styles: { fontStyle: "bold" } }, { content: n1(m.total.p), styles: { fontStyle: "bold" } }, { content: n1(m.total.c), styles: { fontStyle: "bold" } }, { content: n1(m.total.f), styles: { fontStyle: "bold" } }]);
    }
    autoTable(doc, {
      ...tableTheme,
      startY: yy,
      head: [["Food", "Measure (weight)", "kcal", "Protein g", "Carbs g", "Fat g"]],
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
    yy = ensure(lastY() + 5, 10, `Meal plan · Day ${day.day}`);
    doc.setFont("helvetica", "normal");
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
        startY: ensure(y, 30, "Training plan"),
        head: [[t(`${d.title} · ${d.focus}`), "Sets", "Reps", "Rest"]],
        body: d.items.map((i) => [t(i.name), String(i.sets), t(i.reps), `${i.rest} s`]),
        ...(d.finisher ? { foot: [[{ content: t(d.finisher), colSpan: 4 }]], footStyles: { fillColor: [253, 236, 238], textColor: RED, fontStyle: "bold" } } : {}),
        columnStyles: { 1: { cellWidth: 16, halign: "center" }, 2: { cellWidth: 24, halign: "center" }, 3: { cellWidth: 18, halign: "center" } },
        didDrawPage: () => header("Training plan"),
      });
      y = lastY() + 5;
    }
    y = ensure(y, 10, "Training plan");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t("Warm up 5–10 min before every session. Add weight or reps when every set reaches the top of the rep range with good form."), M, y + 2, { maxWidth: W - 2 * M });
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
  y = section(ensure(lastY() + 9, 30, "Guidance"), "Supplements (evidence-based, test first)");
  autoTable(doc, { ...tableTheme, startY: y, head: [["Supplement", "How", "Evidence"]], body: input.supplements.map((s) => [t(s.title), t(s.text), t(s.source)]), columnStyles: { 0: { cellWidth: 32, fontStyle: "bold" }, 2: { cellWidth: 50, textColor: MUTED, fontSize: 7.2 } }, didDrawPage: () => header("Guidance") });
  y = section(ensure(lastY() + 9, 30, "Guidance"), "Habits that make the plan work");
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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  const disclaimer = doc.splitTextToSize(
    t("This plan gives general fitness and nutrition guidance from your coach. It is not a medical diagnosis or treatment. If you are pregnant, breastfeeding, under 18, take medicines for diabetes, blood pressure or thyroid, or have kidney, liver or heart disease, follow your doctor's advice first. Stop and seek medical help for chest pain, fainting or unusual breathlessness."),
    W - 2 * M - 6,
  ) as string[];
  const boxH = disclaimer.length * 3.6 + 5;
  y = ensure(lastY() + 10, boxH, "Method & sources");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setFillColor(253, 236, 238);
  doc.roundedRect(M, y, W - 2 * M, boxH, 2, 2, "F");
  doc.setTextColor(...INK);
  doc.text(disclaimer, M + 3, y + 5.2, { lineHeightFactor: 1.25 });

  // ───── Signed coach card ─────
  y = ensure(y + boxH + 10, 54, "Your coach");
  y = section(y, "Your coach");
  {
    const top = y + 1;
    const h = 46;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.setFillColor(...GOLD_SOFT);
    doc.roundedRect(M, top, W - 2 * M, h, 3, 3, "FD");
    let x = M + 6;
    if (photo) {
      doc.setFillColor(...GOLD);
      doc.circle(x + 13, top + 17, 13.6, "F");
      doc.addImage(photo, "PNG", x, top + 4, 26, 26);
      x += 32;
    }
    const sx = W - M - 64; // signature column
    const colW = sx - 6 - x;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.text(fit(coachName, colW), x, top + 10);
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text(fit(credLine, colW), x, top + 15.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    let ly = top + 21;
    const info = [K.certification.trim(), B.name, [B.phone, ig].filter(Boolean).join("  ·  "), B.site, B.address].filter(Boolean);
    for (const line of info) {
      if (ly > top + h - 3) break;
      doc.text(fit(line, colW), x, ly);
      ly += 4.4;
    }
    // Signature block.
    const sw = W - M - 6 - sx;
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(17);
    doc.setTextColor(...NAVY);
    doc.text(fit(K.name.trim().replace(/^coach\s+/i, ""), sw), sx + sw / 2, top + 19, { align: "center" });
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(sx, top + 22, sx + sw, top + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(...MUTED);
    doc.text(t(`${coachName} · ${K.title}`), sx + sw / 2, top + 26.5, { align: "center", maxWidth: sw });
    doc.text(t(`Issued ${today}`), sx + sw / 2, top + 33, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...RED);
    doc.text(t(`Next review: ${nextReview}`), sx + sw / 2, top + 37.5, { align: "center" });
  }

  // Watermark + credited footer on every page.
  const pages = doc.getNumberOfPages();
  const wm1 = t(B.name.toUpperCase());
  const wm2 = t(`${coachName} · ${K.title}`.toUpperCase());
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Diagonal watermark along the page diagonal, centred. jsPDF rotates text about its start point,
    // so the start is offset back along the text direction by half the text width.
    const deg = (Math.atan2(H, W) * 180) / Math.PI;
    const rad = (deg * Math.PI) / 180;
    const diag = Math.hypot(W, H);
    const draw = (s: string, maxW: number, maxSize: number, offset: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const size = Math.min(maxSize, (10 * maxW) / (doc.getTextWidth(s) + 0.6 * s.length));
      doc.setFontSize(size);
      const w = doc.getTextWidth(s) + 0.6 * (s.length - 1); // + charSpace
      const cx = W / 2 + offset * Math.sin(rad);
      const cy = H / 2 + offset * Math.cos(rad);
      doc.text(s, cx - (w / 2) * Math.cos(rad), cy + (w / 2) * Math.sin(rad), { angle: deg, charSpace: 0.6 });
    };
    doc.setGState(doc.GState({ opacity: 0.065 }));
    doc.setTextColor(...NAVY);
    draw(wm1, diag * 0.66, 54, 0);
    doc.setTextColor(...RED);
    draw(wm2, diag * 0.5, 16, 12);
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(M, H - 12, W - M, H - 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...NAVY);
    doc.text(fit(`Plan designed by ${coachName} — ${credLine}`, W - 2 * M - 26), M, H - 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 8, { align: "right" });
    doc.setFontSize(6.8);
    doc.text(fit(`${B.name} · ${B.phone}${ig ? ` · ${ig}` : ""} · ${B.site} · Confidential — prepared for ${clientName}`, W - 2 * M), M, H - 4.4);
  }

  const safe = (c.name.trim() || "client").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  doc.save(`royal-fitness-plan-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
