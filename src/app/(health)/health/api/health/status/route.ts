import { NextResponse } from "next/server";
import { healthCheckAll } from "@/health/services/health/registry";
import { cacheStats } from "@/health/services/health/cache";
import { db, isDbConfigured } from "@/health/db";
import { sql } from "drizzle-orm";

export const revalidate = 0;

export async function GET() {
  let dbStatus: "up" | "down" | "unconfigured" = isDbConfigured ? "down" : "unconfigured";
  if (isDbConfigured) {
    try {
      await db.execute(sql`select 1`);
      dbStatus = "up";
    } catch {
      dbStatus = "down";
    }
  }

  const providers = await healthCheckAll();

  return NextResponse.json({
    ok: true,
    db: dbStatus,
    cache: cacheStats(),
    providers: providers.map((p) => ({
      provider: p.provider,
      status: p.status,
      enabled: p.enabled,
      lastCheck: p.lastCheck,
      responseTimeMs: p.responseTimeMs,
      message: p.message,
    })),
    totalProviders: providers.length,
    enabledProviders: providers.filter((p) => p.enabled).length,
    time: new Date().toISOString(),
  });
}
