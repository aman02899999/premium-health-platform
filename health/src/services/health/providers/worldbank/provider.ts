import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";
import { getIndiaHealthIndicators } from "@/lib/worldbank";

export class WorldBankProvider extends BaseHealthProvider<unknown> {
  name = "worldbank";
  displayName = "World Bank Open Data";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: false, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_WORLDBANK !== "false",
    baseUrl: "https://api.worldbank.org/v2",
    requiresKey: false,
    ttlMs: TTL.worldbank,
    timeoutMs: 9000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<unknown>> {
    const data = await getIndiaHealthIndicators();
    return {
      data: data.indicators as unknown[],
      total: data.indicators.length,
      limit: params.limit ?? 20,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: data.live,
      cached: !data.live,
      fetchedAt: data.fetchedAt,
    };
  }

  async getById() {
    return null;
  }
}

export const worldBankProvider = new WorldBankProvider();
