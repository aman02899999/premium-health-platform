import "server-only";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/lib/auth";
import { currentCustomer } from "@/lib/shop/server";
import { hasAccess } from "./store";

export type LabViewer = { email: string; name: string; allowed: boolean; admin: boolean };

/** The signed-in person and whether the analyser is switched on for them (admins always are). */
export async function labViewer(): Promise<LabViewer | null> {
  const c = await currentCustomer();
  if (!c) return null;
  const admin = await isAdmin().catch(() => false);
  const allowed = admin || (isDbConfigured && (await hasAccess(c.email).catch(() => false)));
  return { email: c.email, name: c.name, allowed, admin };
}
