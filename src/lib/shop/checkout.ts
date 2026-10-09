// Checkout form validation and order numbers. Pure, shared by the API and tests.
import type { Address, CartLine } from "./types";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export type Buyer = { name: string; email: string; phone: string; address: Address; note: string };

const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** Returns a message for the shopper, or the cleaned details. */
export function parseBuyer(b: Record<string, unknown>): Buyer | string {
  const digits = t(b.phone, 20).replace(/\D/g, "");
  const phone = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  const out: Buyer = {
    name: t(b.name, 80),
    email: t(b.email, 120).toLowerCase(),
    phone,
    address: { line1: t(b.line1, 160), line2: t(b.line2, 160), landmark: t(b.landmark, 100), city: t(b.city, 60), state: t(b.state, 60), pincode: t(b.pincode, 6) },
    note: typeof b.note === "string" ? b.note.trim().slice(0, 500) : "",
  };
  if (out.name.length < 2) return "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return "Please enter a valid email — your order confirmation goes there.";
  if (!/^[6-9]\d{9}$/.test(out.phone)) return "Please enter a valid 10-digit mobile number for the courier.";
  if (out.address.line1.length < 5) return "Please enter your house number and street.";
  if (out.address.city.length < 2) return "Please enter your city.";
  if (!INDIAN_STATES.includes(out.address.state)) return "Please choose your state.";
  if (!/^[1-9]\d{5}$/.test(out.address.pincode)) return "Please enter a valid 6-digit PIN code.";
  return out;
}

/** Keeps only well-formed cart lines from the request body. */
export function parseCart(v: unknown): CartLine[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 50).flatMap((l): CartLine[] => {
    if (!l || typeof l !== "object") return [];
    const o = l as Record<string, unknown>;
    if (typeof o.id !== "string" || !/^[0-9a-f-]{36}$/i.test(o.id)) return [];
    const qty = Math.max(1, Math.min(20, Math.floor(Number(o.qty) || 1)));
    if (o.kind === "combo") return [{ kind: "combo", id: o.id, qty }];
    if (o.kind === "product") return [{ kind: "product", id: o.id, qty, flavour: typeof o.flavour === "string" ? o.flavour.slice(0, 60) : undefined }];
    return [];
  });
}

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
/** "RS-7K2Q9XMA": short enough to read out on the phone, no 0/O/1/I/L. */
export function orderNumber(random: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  return `RS-${s}`;
}
