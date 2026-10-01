import "server-only";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db, isDbConfigured } from "@/health/db";
import { premiumSubscriptions } from "@/health/db/monetization-schema";
import { supabaseConfigured } from "@/health/lib/supabase/config";
import { createClient } from "@/health/lib/supabase/server";
import type { AuthUser } from "./index";

// Server-side identity for the health platform. The session is the Supabase
// cookie shared with the Royal Fitness Club site (same project, same users);
// it is verified from the JWT, never trusted from client-written values.

export type ServerUser = Omit<AuthUser, "role"> & { role: "user" | "admin" };

export async function currentUser(): Promise<ServerUser | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.email || !claims.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, string>;
  const appMeta = (claims.app_metadata ?? {}) as Record<string, string>;
  const email = String(claims.email).toLowerCase();
  return {
    id: String(claims.sub),
    email,
    name: meta.full_name || meta.name || email.split("@")[0],
    image: meta.avatar_url || meta.picture || undefined,
    role: "user",
    provider: appMeta.provider === "google" ? "google" : "email",
    createdAt: new Date(Number(claims.iat ?? 0) * 1000).toISOString(),
  };
}

/** Admins are the emails in public.admins — the same list the gym site uses. */
export async function isAdmin(): Promise<boolean> {
  if (!supabaseConfigured) return process.env.NODE_ENV !== "production";
  if (!(await currentUser())) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export type PremiumState = { isPremium: boolean; plan: string | null; expiresAt: string | null };
const NOT_PREMIUM: PremiumState = { isPremium: false, plan: null, expiresAt: null };

/** Premium comes only from a paid, active row in health.premium_subscriptions. */
export async function premiumFor(email: string): Promise<PremiumState> {
  if (!isDbConfigured) return NOT_PREMIUM;
  try {
    const [row] = await db
      .select({ plan: premiumSubscriptions.plan, end: premiumSubscriptions.currentPeriodEnd })
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.email, email.toLowerCase()),
          eq(premiumSubscriptions.status, "active"),
          or(isNull(premiumSubscriptions.currentPeriodEnd), gt(premiumSubscriptions.currentPeriodEnd, new Date())),
        ),
      )
      .orderBy(desc(premiumSubscriptions.currentPeriodEnd))
      .limit(1);
    return row ? { isPremium: true, plan: row.plan, expiresAt: row.end?.toISOString() ?? null } : NOT_PREMIUM;
  } catch {
    return NOT_PREMIUM;
  }
}

/**
 * Call first thing in every admin page (not only a layout: layouts and pages
 * render in parallel, so a layout-only check can still stream the page's HTML).
 */
export async function requireAdmin(next: string): Promise<void> {
  if (await isAdmin()) return;
  if (!(await currentUser())) redirect(`/health/login?next=${encodeURIComponent(next)}`);
  notFound();
}
