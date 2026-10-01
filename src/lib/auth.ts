import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Admin access:
//  - Supabase configured → Google sign-in; the account's email must be listed in
//    public.admins (checked by the database's is_admin(), the same rule RLS uses).
//  - otherwise (local dev) → one password from ADMIN_PASSWORD, stored as an
//    HMAC-signed expiry timestamp in an httpOnly cookie.

export const ADMIN_COOKIE = "rfc_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEV_PASSWORD = "royal-admin";

export function adminPassword(): string | null {
  if (supabaseConfigured) return null; // Google sign-in replaces the password.
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

export const usingDevPassword = () => !supabaseConfigured && !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";

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

export type SessionUser = { email: string; name: string; avatar: string };

/** The signed-in Supabase user, verified from the session JWT. */
export async function currentUser(): Promise<SessionUser | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.email) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, string>;
  return { email: String(claims.email), name: meta.full_name || meta.name || "", avatar: meta.avatar_url || meta.picture || "" };
}

export async function isAdmin(): Promise<boolean> {
  if (supabaseConfigured) {
    if (!(await currentUser())) return false;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("is_admin");
    return !error && data === true;
  }
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Who made an admin change, for the audit column. */
export async function adminIdentity(): Promise<string> {
  return (await currentUser())?.email ?? "admin (password)";
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
