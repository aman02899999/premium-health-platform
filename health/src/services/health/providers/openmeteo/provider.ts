import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";
import { getIndiaPulse } from "@/lib/realtime";

export class OpenMeteoProvider extends BaseHealthProvider<unknown> {
  name = "openmeteo";
  displayName = "Open-Meteo";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: false, getById: false, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPENMETEO !== "false",
    baseUrl: "https://api.open-meteo.com/v1",
    requiresKey: false,
    ttlMs: TTL.pulse,
    timeoutMs: 7000,
  };

  async search(): Promise<PaginatedResult<unknown>> {
    const data = await getIndiaPulse();
    return {
      data: data.cities as unknown[],
      total: data.cities.length,
      limit: 8,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: data.cities.some((c) => c.live),
      cached: false,
      fetchedAt: data.fetchedAt,
    };
  }

  async getById() {
    return null;
  }
}

export const openMeteoProvider = new OpenMeteoProvider();
