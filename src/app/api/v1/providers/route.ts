import { apiSuccess } from "@/lib/saas/auth";
import { keyedRoute } from "@/lib/saas/handler";
import { listProviders } from "@/services/health/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/providers
 * Requires an API key. The upstream directory: every open data source this API
 * aggregates, with capabilities, licence requirements and whether a key is
 * needed upstream (separate from your key for this API).
 */
export const GET = keyedRoute(async (_req, { auth }) => {
  const providers = listProviders().map((p) => ({
    name: p.name,
    displayName: p.displayName,
    status: p.status,
    enabled: p.config.enabled,
    capabilities: p.capabilities,
    baseUrl: p.config.baseUrl,
    upstreamRequiresKey: p.config.requiresKey,
    upstreamKeyEnvVar: p.config.keyEnvVar,
    cacheTtlMs: p.config.ttlMs,
  }));

  return apiSuccess(
    {
      providers,
      total: providers.length,
      enabled: providers.filter((p) => p.enabled).length,
    },
    auth,
    {},
    3600
  );
});
