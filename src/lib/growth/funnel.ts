// The funnel scoreboard: from enquiry to paying member, by where the lead came from. Pure, so
// the admin page and the Monday morning email show the same numbers.
export type FunnelRow = { source: string; leads: number; booked: number; came: number; joined: number; onlineRupees: number };

/** Readable names for the lead sources the site records. */
const SOURCE_NAMES: Record<string, string> = {
  home: "Website: home page form",
  contact: "Website: contact page form",
  website: "Website: other forms",
  "whatsapp-inbound": "WhatsApp chat",
  "whatsapp-campaign": "Reply to a WhatsApp campaign",
  "diet-tool": "Free diet tool",
};
export const sourceName = (s: string) => SOURCE_NAMES[s] ?? (s.startsWith("qr:") ? `QR code ${s.slice(3)}` : s.replace(/[-_]/g, " "));

export const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

export function funnelTotals(rows: FunnelRow[]): FunnelRow {
  return rows.reduce((t, r) => ({ source: "All", leads: t.leads + r.leads, booked: t.booked + r.booked, came: t.came + r.came, joined: t.joined + r.joined, onlineRupees: t.onlineRupees + r.onlineRupees }), {
    source: "All",
    leads: 0,
    booked: 0,
    came: 0,
    joined: 0,
    onlineRupees: 0,
  });
}

/**
 * The weakest step overall, in plain words: where the most people drop out. Only judged once
 * there are at least 10 leads, so a quiet week doesn't produce advice from noise.
 */
export function biggestLeak(t: FunnelRow): string | null {
  if (t.leads < 10) return null;
  const steps = [
    { rate: t.booked / t.leads, text: `Only ${pct(t.booked, t.leads)} of leads book a trial. Call new leads within minutes and offer two times.` },
    t.booked ? { rate: t.came / t.booked, text: `Only ${pct(t.came, t.booked)} of booked trials show up (or the desk isn't marking Came). Call the evening before.` } : null,
    t.came ? { rate: t.joined / t.came, text: `Only ${pct(t.joined, t.came)} of people who trained with you join. Ask for the sale at the end of the trial, with a one-day offer.` } : null,
  ].filter((s): s is { rate: number; text: string } => !!s);
  return steps.sort((a, b) => a.rate - b.rate)[0]?.text ?? null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Lines for the morning email: the whole funnel, then each source with at least one lead. */
export function funnelLines(rows: FunnelRow[]): string[] {
  const t = funnelTotals(rows);
  if (!t.leads) return [];
  const line = (r: FunnelRow) => `${r.source === "All" ? "All sources" : sourceName(r.source)}: ${r.leads} leads → ${r.booked} booked (${pct(r.booked, r.leads)}) → ${r.came} came → ${r.joined} joined (${pct(r.joined, r.leads)})${r.onlineRupees ? `, ${inr(r.onlineRupees)} online` : ""}`;
  const leak = biggestLeak(t);
  return [line(t), ...rows.map(line), ...(leak ? [`Biggest leak: ${leak}`] : [])];
}
