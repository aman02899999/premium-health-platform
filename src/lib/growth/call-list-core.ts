// Call list: the pure half. Who replied to an offer or clicked its link, minus everyone who
// doesn't need a call (members, people who paid, opted out, already spoken to), hottest first.
// The queries are call-list.ts.

export type Signal = {
  /** 10-digit Indian mobile, or a lower-case email when that's all we have. */
  contact: string;
  phone: string | null;
  email: string | null;
  name: string;
  type: "replied" | "clicked";
  at: string;
  /** The campaign (or message) they responded to. */
  campaign: string;
  /** Their latest message, for a reply. */
  text: string;
};

export type Facts = {
  activeMember: boolean;
  /** Latest payment of any kind from this person. */
  paidAt: string | null;
  optedOut: boolean;
  leadStatus: string | null;
  /** Latest message a person (not the bot) sent them on WhatsApp. */
  humanReplyAt: string | null;
  calls: { at: string; outcome: Outcome }[];
};

export type Outcome = "interested" | "not-interested" | "no-answer";
export const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "interested", label: "Interested" },
  { id: "no-answer", label: "No answer" },
  { id: "not-interested", label: "Not interested" },
];
export const isOutcome = (o: unknown): o is Outcome => OUTCOMES.some((x) => x.id === o);

export const WINDOW_HOURS = 72;
export const MAX_TRIES = 3;
/** After "no answer", try again the next day. */
export const RETRY_HOURS = 20;

export type Prospect = Signal & { tries: number; why: string };

const quote = (t: string) => (t.length > 80 ? `${t.slice(0, 77)}…` : t);

/** What to say to the caller about this person, in one line. */
export function whyLine(s: Pick<Signal, "type" | "campaign" | "text">): string {
  return s.type === "replied" ? `Replied to “${s.campaign}”${s.text ? `: “${quote(s.text)}”` : ""}` : `Clicked the link in “${s.campaign}”`;
}

/**
 * Today's call list from the signals and what we know about each person. One row per person,
 * their strongest signal (a reply beats a click, then the latest), replies first.
 */
export function buildCallList(signals: Signal[], facts: Map<string, Facts>, now = new Date()): Prospect[] {
  const best = new Map<string, Signal>();
  for (const s of signals) {
    const b = best.get(s.contact);
    if (!b || (s.type === "replied" && b.type === "clicked") || (s.type === b.type && s.at > b.at)) best.set(s.contact, { ...s, name: s.name || b?.name || "" });
  }
  const out: Prospect[] = [];
  for (const s of best.values()) {
    if (now.getTime() - Date.parse(s.at) > WINDOW_HOURS * 3_600_000) continue;
    const f = facts.get(s.contact);
    if (f) {
      if (f.activeMember || f.optedOut) continue;
      if (f.leadStatus === "joined" || f.leadStatus === "lost") continue;
      // Paid for anything in the week before the signal or since: not a cold call.
      if (f.paidAt && Date.parse(f.paidAt) > Date.parse(s.at) - 7 * 86_400_000) continue;
      // A coach already wrote to them after they responded.
      if (f.humanReplyAt && f.humanReplyAt > s.at) continue;
      const since = f.calls.filter((c) => c.at > s.at);
      if (since.some((c) => c.outcome !== "no-answer")) continue;
      if (since.length >= MAX_TRIES) continue;
      const last = since.reduce<string | null>((m, c) => (!m || c.at > m ? c.at : m), null);
      if (last && now.getTime() - Date.parse(last) < RETRY_HOURS * 3_600_000) continue;
      out.push({ ...s, tries: since.length, why: whyLine(s) });
    } else out.push({ ...s, tries: 0, why: whyLine(s) });
  }
  return out.sort((a, b) => (a.type === b.type ? b.at.localeCompare(a.at) : a.type === "replied" ? -1 : 1));
}

/** A WhatsApp number or an email, as the call list keys people. */
export function contactKey(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (t.includes("@")) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) && t.length <= 120 ? t : null;
  const d = t.replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
