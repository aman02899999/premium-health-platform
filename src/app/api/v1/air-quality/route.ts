import { apiError, apiSuccess } from "@/lib/saas/auth";
import { floatParam, keyedRoute } from "@/lib/saas/handler";
import { openMeteoAirProvider } from "@/services/health/providers/openmeteo-air/provider";

export const dynamic = "force-dynamic";

/** Delhi — the default when no coordinates are supplied. */
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.209;

/**
 * GET /api/v1/air-quality?lat=28.6139&lon=77.209
 * Requires an API key. Current PM2.5 / PM10 / ozone / NO2 with a European AQI
 * band and health advice. Air pollution is a first-order health input in India.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const hasCoords = url.searchParams.has("lat") || url.searchParams.has("lon");
  const lat = floatParam(url, "lat", DEFAULT_LAT, -90, 90);
  const lon = floatParam(url, "lon", DEFAULT_LON, -180, 180);

  const reading = await openMeteoAirProvider.readAirQuality(lat, lon);
  if (!reading) {
    return apiError(503, "upstream_unavailable", "Air quality data is unavailable for these coordinates right now. Please retry shortly.");
  }

  return apiSuccess(
    {
      ...reading,
      requested: { lat, lon },
      defaulted: !hasCoords,
      attribution: "Open-Meteo air quality (CAMS), CC BY 4.0",
    },
    auth,
    {},
    600
  );
});
