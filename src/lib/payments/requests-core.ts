// Payment requests ("WhatsApp Payments"): the pure half (amounts, purposes, codes, the chat
// message). The database half is requests.ts.

export const REQUEST_DAYS = 7;
export const MIN_RUPEES = 1;
export const MAX_RUPEES = 500000;

/** Rupees from what the desk types ("1,500", "₹ 2000"); null when it isn't a sensible amount. */
export function parseAmount(v: unknown): number | null {
  const t = typeof v === "number" ? String(v) : typeof v === "string" ? v.replace(/[₹,\s]/g, "") : "";
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n >= MIN_RUPEES && n <= MAX_RUPEES ? Math.round(n * 100) / 100 : null;
}

/** What the payment is for, as the customer will see it on the payment page and receipt. */
export function cleanPurpose(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim().slice(0, 120);
  return t.length >= 2 ? t : null;
}

/** Quick picks for the chat panel; the desk can type anything else. */
export const PURPOSES = ["Personal training (1 month)", "Membership balance", "Diet consultation", "Locker / towel", "Supplements"] as const;

/** 16 characters from a URL-safe alphabet: unguessable, so a link can't be found by trying. */
export function newToken(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => A[b % A.length]).join("");
}
export const isToken = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9]{12,24}$/.test(t);

export const payUrl = (siteUrl: string, token: string) => `${siteUrl}/pay/${token}`;

const inr = (rupees: number) => `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** The WhatsApp message carrying the link. */
export function requestMessage(r: { purpose: string; rupees: number; url: string; gym: string; days?: number }): string {
  return [`Payment request from ${r.gym}`, `*${r.purpose}*: ${inr(r.rupees)}`, ``, `Pay securely (UPI, card, netbanking): ${r.url}`, `The link works for ${r.days ?? REQUEST_DAYS} days.`].join("\n");
}

export function receiptMessage(r: { purpose: string; rupees: number; paymentId: string; gym: string }): string {
  return [`✅ Payment received, thank you!`, `${r.purpose}: ${inr(r.rupees)}`, `Payment ID: ${r.paymentId}`, `— ${r.gym}`].join("\n");
}

export type RequestState = "open" | "paid" | "cancelled" | "expired";
export function requestState(r: { status: string; expiresAt: string | Date }, now = new Date()): RequestState {
  if (r.status === "paid") return "paid";
  if (r.status === "cancelled") return "cancelled";
  return new Date(r.expiresAt) < now ? "expired" : "open";
}
