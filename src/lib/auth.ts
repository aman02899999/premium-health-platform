import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Single-owner admin: one password from ADMIN_PASSWORD, session is an
// HMAC-signed expiry timestamp in an httpOnly cookie. No user table needed.

export const ADMIN_COOKIE = "rfc_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEV_PASSWORD = "royal-admin";

export function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

export const usingDevPassword = () => !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";

function secret(): string {
  return process.env.ADMIN_SECRET || adminPassword() || "unset";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  // Compare HMACs so lengths always match and timing leaks nothing.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${pw}`));
}

export function createSessionToken(now = Date.now()): string {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminPassword()) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) > now;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

// Naive per-instance login throttle: 8 attempts / 15 min per IP.
const attempts = new Map<string, { count: number; reset: number }>();
export function allowLoginAttempt(ip: string, now = Date.now()): boolean {
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 8;
}
