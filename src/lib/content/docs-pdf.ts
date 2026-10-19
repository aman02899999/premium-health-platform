// Small branded PDFs for visitors: the plans & terms sheet and the proof-of-results page.
// Server-only (jsPDF + AutoTable, loaded on demand), built from the same data the pages show.
import "server-only";
import type { OfferPlan } from "@/lib/offers";
import type { CaseStudy, SiteContent } from "./types";
import { basePlan, perMonth, planFaqs, planFeatures, planSummary, savingPct } from "./plans";
import { caseStudyRows, resultStats } from "./results";
import { pdfText as t } from "@/lib/diet-pro/pdf-core";
import { absoluteUrl, formatINR } from "@/lib/site";

const NAVY: [number, number, number] = [4, 70, 109];
const RED: [number, number, number] = [232, 57, 75];
const M = 14;

async function start(c: SiteContent, title: string, subtitle: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 24, "F");
  doc.setFillColor(...RED);
  doc.rect(0, 24, W, 1.4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(16).text(t(c.business.name.toUpperCase()), M, 11);
  doc.setFont("helvetica", "normal").setFontSize(9).text(t(subtitle), M, 18);
  doc.setFont("helvetica", "bold").setFontSize(11).text(t(title), W - M, 11, { align: "right" });
  doc.setTextColor(30, 30, 30);
  const footer = () => {
    const H = doc.internal.pageSize.getHeight();
    const a = c.business.address;
    doc.setDrawColor(200).line(M, H - 14, W - M, H - 14);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(90, 90, 90);
    doc.text(t(`${a.street}, ${a.locality}, ${a.city} ${a.postalCode} · Call / WhatsApp ${c.business.phone} · ${absoluteUrl("/").replace(/^https?:\/\//, "").replace(/\/$/, "")}`), M, H - 9);
  };
  return { doc, autoTable, W, footer };
}

const table = (startY: number) => ({
  startY,
  margin: { left: M, right: M },
  theme: "grid" as const,
  headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" as const, halign: "center" as const },
  styles: { fontSize: 8, cellPadding: 1.6, lineColor: [210, 210, 210] as [number, number, number], textColor: [30, 30, 30] as [number, number, number] },
  alternateRowStyles: { fillColor: [247, 247, 247] as [number, number, number] },
});

/** Plans, prices, inclusions, a short summary of each plan and the membership terms. */
export async function plansPdf(c: SiteContent, plans: OfferPlan[], today: string): Promise<Buffer> {
  const { doc, autoTable, W, footer } = await start(c, "Membership plans & terms", `Prices as of ${today} · Sector 93, Noida`);
  const { features, has } = planFeatures(plans);
  const base = basePlan(plans);
  const tick = (b: boolean) => (b ? "Yes" : "-");
  autoTable(doc, {
    ...table(32),
    head: [["", ...plans.map((p) => t(p.name))]],
    body: [
      ["Duration", ...plans.map((p) => t(p.duration))],
      ["Price (1 person)", ...plans.map((p) => t(formatINR(p.price)))],
      ["Per month", ...plans.map((p) => t(`~${formatINR(perMonth(p))}`))],
      [`Saving vs ${t(base?.name ?? "")}`, ...plans.map((p) => (savingPct(p, base) ? `${savingPct(p, base)}%` : "-"))],
      ["Couple (2 people)", ...plans.map((p) => (p.couplePrice > 0 ? t(formatINR(p.couplePrice)) : "-"))],
      ...features.map((f) => [t(f), ...plans.map((p) => tick(has(p.id, f)))]),
    ],
    columnStyles: { 0: { fontStyle: "bold", textColor: NAVY, cellWidth: 46 } },
    bodyStyles: { halign: "center" },
  });
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  const offerEnds = plans.find((p) => p.offer)?.offer?.endsOn;
  doc.setFont("helvetica", "italic").setFontSize(7.5).setTextColor(90, 90, 90);
  const notes = [offerEnds ? `Offer prices valid until ${offerEnds}; standard prices apply after that. Couple prices are standard prices.` : "", c.planNote].filter(Boolean);
  for (const n of notes) {
    const lines = doc.splitTextToSize(t(n), W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 1;
  }

  const section = (title: string) => {
    if (y > 250) {
      footer();
      doc.addPage();
      y = 18;
    }
    y += 3;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...NAVY).text(t(title), M, y);
    y += 5;
  };
  const para = (head: string, body: string) => {
    const lines = doc.splitTextToSize(t(body), W - 2 * M);
    if (y + 4 + lines.length * 3.6 > 280) {
      footer();
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(30, 30, 30).text(t(head), M, y);
    y += 3.8;
    doc.setFont("helvetica", "normal").setFontSize(8.2).setTextColor(60, 60, 60).text(lines, M, y);
    y += lines.length * 3.6 + 2.5;
  };

  section("Which plan fits you");
  for (const p of plans) para(`${p.name} · ${formatINR(p.price)}`, planSummary(p, plans));
  section("Membership terms");
  for (const f of planFaqs(c.business)) para(f.q, f.a);
  para("Full policy", `The complete Refund & Cancellation Policy is at ${absoluteUrl("/refund-policy")}.`);
  footer();
  return Buffer.from(doc.output("arraybuffer"));
}

/** One page of consented member results: the averages, then each case study's before/after numbers. */
export async function resultsPdf(c: SiteContent, studies: CaseStudy[], today: string): Promise<Buffer> {
  const { doc, autoTable, W, footer } = await start(c, "Proof of results", `Member results shared with consent · as of ${today}`);
  const stats = resultStats(studies);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(60, 60, 60);
  const intro = doc.splitTextToSize(
    t(`These are real members of ${c.business.name} who agreed to share their numbers. Measurements were taken at the gym at the start and end of the period shown. Averages cover only these ${stats.count} members; individual results vary.`),
    W - 2 * M,
  );
  doc.text(intro, M, 32);
  let y = 32 + intro.length * 3.8 + 3;
  const tiles = stats.tiles.slice(0, 5);
  if (tiles.length) {
    const w = (W - 2 * M - (tiles.length - 1) * 4) / tiles.length;
    tiles.forEach((tile, i) => {
      const x = M + i * (w + 4);
      doc.setFillColor(245, 247, 250).roundedRect(x, y, w, 18, 2, 2, "F");
      doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...RED).text(t(tile.value), x + w / 2, y + 8, { align: "center" });
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(70, 70, 70).text(doc.splitTextToSize(t(tile.label), w - 4), x + w / 2, y + 13, { align: "center" });
    });
    y += 24;
  }
  autoTable(doc, {
    ...table(y),
    head: [["Member", "Program", "Weeks", "Weight (kg)", "Waist (cm)", "Lift", "Verified"]],
    body: caseStudyRows(studies).map((r) => [r.name, r.program, String(r.weeks), r.weight, r.waist, r.lift, r.verifiedOn].map((v) => t(v))),
    styles: { ...table(y).styles, fontSize: 7.6 },
  });
  footer();
  return Buffer.from(doc.output("arraybuffer"));
}
