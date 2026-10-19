// The admin's morning email: everything that happened in the last 24 hours and everything that
// needs a person, in one message. Pure builder + one query, so the content is tested without a
// database. It lists names and counts, never health details (those stay behind the admin login).
import type { Draft } from "./messages";

export type DigestData = {
  leads: { name: string; source: string }[];
  payments: { kind: "Membership" | "Diet plan" | "Supplements" | "Book"; name: string; rupees: number; what: string }[];
  plansToReview: { name: string; plan: string }[];
  clientUpdates: number;
  unanswered: { channel: string; name: string; text: string }[];
  expiringMembers: { name: string; expiresOn: string }[];
  failedMessages: number;
  /** Campaign activity: messages sent in the last 24 hours, WhatsApp promotions waiting for the daily cap, and campaigns that led to payments. */
  campaigns?: { sent: number; held: number; results: { name: string; buyers: number; revenue: number }[] };
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const section = (title: string, lines: string[], empty: string) => `${title}\n${lines.length ? lines.map((l) => `• ${l}`).join("\n") : `• ${empty}`}`;

export function adminDigest(date: string, d: DigestData, to: string, adminUrl: string): Draft {
  const revenue = d.payments.reduce((s, p) => s + p.rupees, 0);
  const needs = d.plansToReview.length + d.unanswered.length + d.failedMessages;
  const subject = `${date}: ${d.payments.length ? `${inr(revenue)} from ${d.payments.length} payment${d.payments.length === 1 ? "" : "s"}` : "no payments"} · ${d.leads.length} new lead${d.leads.length === 1 ? "" : "s"}${needs ? ` · ${needs} need you` : ""}`;
  const body = [
    `Your last 24 hours at a glance.`,
    section("NEEDS YOU", [
      ...d.plansToReview.map((p) => `Review ${p.name}'s ${p.plan} (health details shared)`),
      ...d.unanswered.slice(0, 10).map((m) => `Reply to ${m.name || "someone"} on ${m.channel}: "${m.text.slice(0, 80)}"`),
      ...(d.failedMessages ? [`${d.failedMessages} automatic message${d.failedMessages === 1 ? "" : "s"} failed to send (see Messages)`] : []),
    ], "Nothing: the automation handled everything."),
    section(`PAYMENTS (${inr(revenue)})`, d.payments.map((p) => `${p.kind}: ${p.name}, ${p.what}, ${inr(p.rupees)}`), "None today."),
    section(`NEW LEADS (${d.leads.length})`, d.leads.slice(0, 20).map((l) => `${l.name} (${l.source})`), "None today."),
    section("RENEWALS DUE THIS WEEK", d.expiringMembers.slice(0, 20).map((m) => `${m.name}, ends ${m.expiresOn} (reminder sent automatically)`), "None."),
    d.campaigns && (d.campaigns.sent || d.campaigns.held || d.campaigns.results.length)
      ? section(
          "CAMPAIGNS",
          [
            ...(d.campaigns.sent ? [`${d.campaigns.sent} campaign message${d.campaigns.sent === 1 ? "" : "s"} sent`] : []),
            ...(d.campaigns.held ? [`${d.campaigns.held} WhatsApp promotion${d.campaigns.held === 1 ? "" : "s"} waiting for tomorrow (daily limit protects your number)`] : []),
            ...d.campaigns.results.map((r) => `${r.name}: ${r.buyers} paid within 14 days, ${inr(r.revenue)}`),
          ],
          "",
        )
      : "",
    d.clientUpdates ? `Clients built ${d.clientUpdates} updated plan${d.clientUpdates === 1 ? "" : "s"} from their dashboard.` : "",
    `[[CTA:Open the admin|${adminUrl}]]`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { channel: "email", to, toName: "Admin", kind: "admin-digest", subject: subject.slice(0, 200), body: body.slice(0, 2000), template: "", params: [], dedupeKey: `admin-digest:${date}` };
}
