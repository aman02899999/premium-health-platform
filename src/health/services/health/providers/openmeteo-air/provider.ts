import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

/**
 * Open-Meteo Air Quality — current PM2.5, PM10, ozone, NO2, SO2 and CO plus the
 * European AQI, for any coordinate. Air pollution is a first-order health input
 * in India, so this feeds the "is it safe to walk/run outside" guidance.
 *
 * Source: https://open-meteo.com/en/docs/air-quality-api (no key required)
 * Licence: CC BY 4.0 — attribution required.
 */

const POLLUTANT_UNITS: Record<string, string> = {
  pm10: "µg/m³",
  pm2_5: "µg/m³",
  carbon_monoxide: "µg/m³",
  nitrogen_dioxide: "µg/m³",
  sulphur_dioxide: "µg/m³",
  ozone: "µg/m³",
};

/** European AQI bands (Open-Meteo uses the European Common Air Quality Index). */
export function europeanAqiLevel(aqi: number): { level: string; advice: string } {
  if (!Number.isFinite(aqi)) return { level: "Unknown", advice: "Air quality data is unavailable right now." };
  if (aqi <= 20) return { level: "Good", advice: "Air quality is good. Outdoor exercise is fine." };
  if (aqi <= 40) return { level: "Fair", advice: "Air quality is acceptable. Sensitive groups may prefer shorter outdoor sessions." };
  if (aqi <= 60) return { level: "Moderate", advice: "Sensitive groups (asthma, COPD, heart disease, pregnancy, children) should reduce prolonged outdoor exertion." };
  if (aqi <= 80) return { level: "Poor", advice: "Limit outdoor exertion. Sensitive groups should stay indoors where possible." };
  if (aqi <= 100) return { level: "Very poor", advice: "Avoid outdoor exercise. Keep windows closed and consider an air purifier." };
  return { level: "Extremely poor", advice: "Stay indoors, avoid outdoor exertion and follow local health advisories." };
}

export type AirQualityReading = {
  location: { lat: number; lon: number };
  aqi: { european_aqi: number; level: string; advice: string };
  pollutants: Record<string, number>;
  measuredAt: string;
  provenance: DataProvenance;
};

export class OpenMeteoAirProvider extends BaseHealthProvider<AirQualityReading> {
  name = "openmeteo-air";
  displayName = "Open-Meteo Air Quality";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: false, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_OPENMETEO_AIR !== "false",
    baseUrl: process.env.OPENMETEO_AIR_API_URL || "https://air-quality-api.open-meteo.com/v1",
    requiresKey: false,
    ttlMs: TTL.pulse,
    timeoutMs: 7000,
  };

  /** Search here means "read the nearest station for these coordinates". */
  async search(params: SearchParams): Promise<PaginatedResult<AirQualityReading>> {
    const lat = Number(params.filters?.lat ?? 28.6139);
    const lon = Number(params.filters?.lon ?? 77.209);
    const reading = await this.readAirQuality(lat, lon);
    const data = reading ? [reading] : [];

    return {
      data,
      total: data.length,
      limit: 1,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: data.length > 0,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById() {
    return null;
  }

  /** Reads the nearest station for a coordinate — not the base class's getDetails(id). */
  async readAirQuality(lat: number, lon: number): Promise<AirQualityReading | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

    const variables = `${Object.keys(POLLUTANT_UNITS).join(",")},european_aqi,us_aqi`;
    const url =
      `${this.config.baseUrl}/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=${variables}&timezone=UTC`;

    const json = (await this.fetchJson(url)) as
      | { current?: Record<string, number | string>; latitude?: number; longitude?: number }
      | null;
    const current = json?.current;
    if (!current) return null;

    const aqi = Number(current.european_aqi);
    const pollutants: Record<string, number> = {};
    for (const name of Object.keys(POLLUTANT_UNITS)) {
      const value = Number(current[name]);
      if (Number.isFinite(value)) pollutants[name] = value;
    }

    return {
      location: { lat: json?.latitude ?? lat, lon: json?.longitude ?? lon },
      aqi: { european_aqi: aqi, ...europeanAqiLevel(aqi) },
      pollutants,
      measuredAt: String(current.time ?? new Date().toISOString()),
      provenance: {
        source: this.displayName,
        source_id: `${lat},${lon}`,
        source_url: "https://open-meteo.com/en/docs/air-quality-api",
        license: "CC BY 4.0",
        attribution: "Open-Meteo (CAMS European air quality forecasts)",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

export const openMeteoAirProvider = new OpenMeteoAirProvider();
