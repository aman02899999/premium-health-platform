import { db, isDbConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Healthcheck must stay green so the preview/orchestrator never marks a
  // healthy app as down during transient DB hiccups. DB state is reported
  // in the payload instead of the status code.
  let dbStatus: "up" | "down" | "unconfigured" = isDbConfigured ? "down" : "unconfigured";
  if (isDbConfigured) {
    try {
      await db.execute(sql`select 1`);
      dbStatus = "up";
    } catch {
      dbStatus = "down";
    }
  }
  return Response.json({ ok: true, db: dbStatus, time: new Date().toISOString() });
}
