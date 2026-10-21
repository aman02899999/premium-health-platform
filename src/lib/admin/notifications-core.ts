// Notifications: the pure half. What each kind of event looks like in the bell, and who may see
// it (the same rules as the pages it links to). The queries are notifications.ts.
import { allowed, type Role } from "./team-core";

export type NoticeKind = "message" | "handoff" | "lead" | "payment" | "plan" | "order" | "review" | "failed";

export type Notice = { id: string; at: string; kind: NoticeKind; title: string; body: string; href: string };

export const KIND_LABEL: Record<NoticeKind, string> = {
  message: "Message",
  handoff: "Needs a person",
  lead: "New lead",
  payment: "Payment",
  plan: "Diet plan to write",
  order: "Order to ship",
  review: "Review to approve",
  failed: "Message failed",
};

/** Alerts that need someone now; the rest are for information. */
export const URGENT: NoticeKind[] = ["handoff", "message", "plan", "failed"];

/** Only what this role may open, newest first. */
export function forRole(items: Notice[], role: Role): Notice[] {
  return items.filter((n) => allowed(role, n.href.split(/[?#]/)[0])).sort((a, b) => b.at.localeCompare(a.at));
}

export function unreadCount(items: Notice[], seenAt: string | null): number {
  return seenAt ? items.filter((n) => n.at > seenAt).length : items.length;
}

/** Items that arrived after the last poll, for a desktop alert (at most 3, so a burst isn't a flood). */
export function freshSince(items: Notice[], lastAt: string | null): Notice[] {
  if (!lastAt) return [];
  return items.filter((n) => n.at > lastAt).slice(0, 3);
}

export const clip = (t: string, n = 90) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};
