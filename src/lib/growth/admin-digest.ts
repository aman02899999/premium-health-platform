// The admin's morning email: everything that happened in the last 24 hours and everything that
// needs a person, in one message. Pure builder + one query, so the content is tested without a
// database. It lists names and counts, never health details (those stay behind the admin login).
import type { Draft } from "./messages";
import { formatTrial, istParts } from "./trials";
import { funnelLines, type FunnelRow } from "./funnel";

export type DigestData = {
  leads: { name: string; source: string }[];
  /** Booked trials for today, and earlier ones (last 3 days) nobody has marked as came or didn't come. */
  trials?: { name: string; at: string }[];
  /** Form leads still "new" 2 hours to 3 days after arriving. */
  uncontacted?: number;
  /** Mondays: the last 30 days, enquiry to member, by source. */
  funnel?: FunnelRow[];
  payments: { kind: "Membership" | "Diet plan" | "Supplements" | "Book" | "Payment link"; name: string; rupees: number; what: string }[];
  plansToReview: { name: string; plan: string }[];
  clientUpdates: number;
  unanswered: { channel: string; name: string; text: string }[];
  expiringMembers: { name: string; expiresOn: string }[];
  failedMessages: number;
  /** Campaign activity: messages sent in the last 24 hours, WhatsApp promotions waiting for the daily cap, and campaigns that led to payments. */
  campaigns?: {
    sent: number;
    held: number;
    results: { name: string; buyers: number; revenue: number }[];
    /** Per running campaign: how far its messages got (delivered, read, clicked, replied). */
    funnel?: { name: string; sent: number; delivered: number; read: number; clicked: number; replied: number; undelivered: number; topReason: string | null }[];
  };
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const section = (title: string, lines: string[], empty: string) => `${title}\n${lines.length ? lines.map((l) => `• ${l}`).join("\n") : `• ${empty}`}`;

export function adminDigest(date: string, d: DigestData, to: string, adminUrl: string): Draft {
  const revenue = d.payments.reduce((s, p) => s + p.rupees, 0);
  const trials = d.trials ?? [];
  const todays = trials.filter((t) => istParts(t.at).date === date);
  const unmarked = trials.filter((t) => istParts(t.at).date < date);
  const uncontacted = d.uncontacted ?? 0;
  const needs = d.plansToReview.length + d.unanswered.length + d.failedMessages + unmarked.length + (uncontacted ? 1 : 0);
  const subject = `${date}: ${d.payments.length ? `${inr(revenue)} from ${d.payments.length} payment${d.payments.length === 1 ? "" : "s"}` : "no payments"} · ${d.leads.length} new lead${d.leads.length === 1 ? "" : "s"}${needs ? ` · ${needs} need you` : ""}`;
  const body = [
    `Your last 24 hours at a glance.`,
    section("NEEDS YOU", [
      ...d.plansToReview.map((p) => `Review ${p.name}'s ${p.plan} (health details shared)`),
      ...d.unanswered.slice(0, 10).map((m) => `Reply to ${m.name || "someone"} on ${m.channel}: "${m.text.slice(0, 80)}"`),
      ...(d.failedMessages ? [`${d.failedMessages} automatic message${d.failedMessages === 1 ? "" : "s"} failed to send (see Messages)`] : []),
      ...(uncontacted ? [`${uncontacted} lead${uncontacted === 1 ? " has" : "s have"} had no call or message yet (Leads → New)`] : []),
      ...unmarked.map((t) => `Did ${t.name} come for the trial on ${formatTrial(t.at)}? Mark Came or No-show in Leads`),
    ], "Nothing: the automation handled everything."),
    todays.length ? section(`TRIALS TODAY (${todays.length})`, todays.map((t) => `${formatTrial(t.at).split(", ").pop()}: ${t.name}`), "") : "",
    section(`PAYMENTS (${inr(revenue)})`, d.payments.map((p) => `${p.kind}: ${p.name}, ${p.what}, ${inr(p.rupees)}`), "None today."),
    section(`NEW LEADS (${d.leads.length})`, d.leads.slice(0, 20).map((l) => `${l.name} (${l.source})`), "None today."),
    section("RENEWALS DUE THIS WEEK", d.expiringMembers.slice(0, 20).map((m) => `${m.name}, ends ${m.expiresOn} (reminder sent automatically)`), "None."),
    d.campaigns && (d.campaigns.sent || d.campaigns.held || d.campaigns.results.length || d.campaigns.funnel?.length)
      ? section(
          "CAMPAIGNS",
          [
            ...(d.campaigns.sent ? [`${d.campaigns.sent} campaign message${d.campaigns.sent === 1 ? "" : "s"} sent`] : []),
            ...(d.campaigns.held ? [`${d.campaigns.held} WhatsApp promotion${d.campaigns.held === 1 ? "" : "s"} waiting for tomorrow (daily limit protects your number)`] : []),
            ...(d.campaigns.funnel ?? []).map((f) => {
              const pct = (n: number) => `${n} (${Math.round((n / f.sent) * 100)}%)`;
              const parts = [`${f.sent} sent`, `${pct(f.delivered)} delivered`, `${pct(f.read)} read`, `${pct(f.clicked)} clicked`, ...(f.replied ? [`${f.replied} replied`] : [])];
              const lost = f.undelivered ? `; ${f.undelivered} not delivered${f.topReason ? `, mostly "${f.topReason}"` : ""}` : "";
              return `${f.name}: ${parts.join(", ")}${lost}`;
            }),
            ...d.campaigns.results.map((r) => `${r.name}: ${r.buyers} paid within 14 days, ${inr(r.revenue)}`),
          ],
          "",
        )
      : "",
    d.funnel?.length ? section("FUNNEL, LAST 30 DAYS", funnelLines(d.funnel), "") : "",
    d.clientUpdates ? `Clients built ${d.clientUpdates} updated plan${d.clientUpdates === 1 ? "" : "s"} from their dashboard.` : "",
    `[[CTA:Open the admin|${adminUrl}]]`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { channel: "email", to, toName: "Admin", kind: "admin-digest", subject: subject.slice(0, 200), body: body.slice(0, 4000), template: "", params: [], dedupeKey: `admin-digest:${date}` };
}
