import { NextResponse } from "next/server";
import { listProviders, healthCheckAll } from "@/services/health/registry";

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const check = searchParams.get("health") === "true";

  if (check) {
    const health = await healthCheckAll();
    return NextResponse.json({ providers: health, fetchedAt: new Date().toISOString() });
  }

  const providers = listProviders().map((p) => ({
    name: p.name,
    displayName: p.displayName,
    status: p.status,
    enabled: p.config.enabled,
    capabilities: p.capabilities,
    baseUrl: p.config.baseUrl,
    requiresKey: p.config.requiresKey,
    ttlMs: p.config.ttlMs,
  }));

  return NextResponse.json({ providers, total: providers.length, fetchedAt: new Date().toISOString() });
}
