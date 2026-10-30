// Pure parts of the coach's chat tools: the one-tap replies, and which approved templates make
// sense for a customer once the 24-hour window has closed (with their parameters filled in).
import { formatDate } from "@/lib/growth/dates";
import { TEMPLATES, renewUrl, type MessageKind } from "@/lib/growth/messages";
import type { LeadStatus } from "@/lib/growth/leads";
import type { ReplyCtx } from "./auto-reply";
import { askDetailsMessage, flowReply, type WaOut } from "./wa-flow";

export type ContactFacts = {
  peer: string;
  name: string;
  optedOut: boolean;
  lead: { status: LeadStatus; interest: string; source: string; createdAt: string } | null;
  member: { planName: string; expiresOn: string; active: boolean; renewToken: string | null; offersOk?: boolean } | null;
};

export type QuickReplyId = "trial7" | "offer" | "plans" | "fees" | "visit" | "gymtrial" | "details";

export const QUICK_REPLIES: { id: QuickReplyId; label: string; build: (c: ReplyCtx) => WaOut[] }[] = [
  { id: "trial7", label: "₹49 trial link", build: (c) => flowReply("trial7", c) },
  { id: "offer", label: "Trial offer", build: (c) => flowReply("diet", c) },
  { id: "details", label: "Ask body details", build: () => [askDetailsMessage()] },
  { id: "plans", label: "All plans", build: (c) => flowReply("plans", c) },
  { id: "fees", label: "Gym fees", build: (c) => flowReply("price", c) },
  { id: "gymtrial", label: "Free gym trial", build: (c) => flowReply("trial", c) },
  { id: "visit", label: "Address & timings", build: (c) => flowReply("visit", c) },
];

export type ManualTemplate = { kind: MessageKind; name: string; label: string; marketing: boolean; params: string[]; preview: string };

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";
const fill = (kind: MessageKind, params: string[]) => TEMPLATES[kind].text.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");

/** The templates that fit this customer, most useful first. Promotions are left out after "Stop promotions", and for a register member who hasn't agreed to offers. */
export function manualTemplates(c: ContactFacts, biz: { name: string; phone: string; siteUrl: string }): ManualTemplate[] {
  const hi = first(c.name);
  const out: Omit<ManualTemplate, "name" | "marketing" | "preview">[] = [];
  const m = c.member;
  if (m?.renewToken && m.active) out.push({ kind: "renew-7", label: "Renewal reminder", params: [hi, m.planName, biz.name, formatDate(m.expiresOn), renewUrl(biz.siteUrl, m.renewToken)] });
  if (m?.renewToken && !m.active) out.push({ kind: "comeback", label: "Win back (membership ended)", params: [hi, biz.name, m.planName, renewUrl(biz.siteUrl, m.renewToken)] });
  if (!m && (c.lead?.status === "new" || c.lead?.status === "contacted")) out.push({ kind: "lead-2", label: "Trial not booked yet", params: [hi, biz.name] });
  if (!m) out.push({ kind: "trial-offer", label: "Free trial offer", params: [hi, biz.name, `${biz.siteUrl}/contact#trial`] });
  out.push({ kind: "call-followup", label: "Follow-up: plans & trial", params: [hi, biz.name, `${biz.siteUrl}/membership`] });
  return out
    .map((t) => ({ ...t, name: TEMPLATES[t.kind].name, marketing: TEMPLATES[t.kind].category === "MARKETING", preview: fill(t.kind, t.params) }))
    .filter((t) => !(t.marketing && (c.optedOut || m?.offersOk === false)));
}
