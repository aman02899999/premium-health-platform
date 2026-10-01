import type { Plan } from "@/lib/content/types";

// Pure helpers for online membership checkout (no I/O, safe to unit-test).

export type MembershipQuote = { planId: string; planName: string; duration: string; couple: boolean; amountPaise: number };

/** Price a plan from the server's own plan list: the browser only sends a plan id. */
export function quoteMembership(plans: Plan[], planId: string, couple: boolean): MembershipQuote | null {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return null;
  const rupees = couple ? plan.couplePrice : plan.price;
  if (!Number.isInteger(rupees) || rupees <= 0) return null;
  return { planId: plan.id, planName: plan.name, duration: plan.duration, couple, amountPaise: rupees * 100 };
}

export type CheckoutForm = {
  name: string;
  phone: string;
  email: string | null;
  partnerName: string | null;
  startDate: string | null;
  referredBy: string | null;
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** Validates the buyer's details; returns an error message for the visitor, or the cleaned form. */
export function parseCheckoutForm(body: Record<string, unknown>, couple: boolean, today = new Date()): CheckoutForm | string {
  const name = text(body.name, 80);
  const phoneDigits = text(body.phone, 20).replace(/\D/g, "");
  const phone = phoneDigits.length === 12 && phoneDigits.startsWith("91") ? phoneDigits.slice(2) : phoneDigits;
  const email = text(body.email, 120);
  const partnerName = text(body.partnerName, 80);
  const startDate = text(body.startDate, 10);
  const referredBy = text(body.referredBy, 80);

  if (name.length < 2) return "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter a valid 10-digit Indian mobile number.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address, or leave it blank.";
  if (couple && partnerName.length < 2) return "Please enter your partner's name for the couple plan.";
  if (startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) return "Please pick a valid start date.";
    const day = startDate;
    const todayIso = today.toISOString().slice(0, 10);
    const max = new Date(today.getTime() + 60 * 86400_000).toISOString().slice(0, 10);
    if (day < todayIso || day > max) return "Start date must be within the next 60 days.";
  }
  return {
    name,
    phone,
    email: email || null,
    partnerName: couple ? partnerName : null,
    startDate: startDate || null,
    referredBy: referredBy || null,
  };
}

export const formatPaise = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
