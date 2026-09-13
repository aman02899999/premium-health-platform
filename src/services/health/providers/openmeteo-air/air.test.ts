import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { europeanAqiLevel, openMeteoAirProvider } from "./provider";
import { cacheClear } from "../../cache";

const FIXTURE = {
  latitude: 28.6,
  longitude: 77.2,
  current: {
    time: "2026-09-13T04:00",
    pm10: 150.2,
    pm2_5: 96.4,
    carbon_monoxide: 1200,
    nitrogen_dioxide: 45.1,
    sulphur_dioxide: 12,
    ozone: 88.3,
    european_aqi: 168,
    us_aqi: 201,
  },
};

beforeEach(() => cacheClear());
afterEach(() => vi.unstubAllGlobals());

describe("europeanAqiLevel bands", () => {
  it("maps each band to a level and health advice", () => {
    expect(europeanAqiLevel(10).level).toBe("Good");
    expect(europeanAqiLevel(20).level).toBe("Good");
    expect(europeanAqiLevel(21).level).toBe("Fair");
    expect(europeanAqiLevel(40).level).toBe("Fair");
    expect(europeanAqiLevel(41).level).toBe("Moderate");
    expect(europeanAqiLevel(60).level).toBe("Moderate");
    expect(europeanAqiLevel(61).level).toBe("Poor");
    expect(europeanAqiLevel(80).level).toBe("Poor");
    expect(europeanAqiLevel(81).level).toBe("Very poor");
    expect(europeanAqiLevel(100).level).toBe("Very poor");
    expect(europeanAqiLevel(101).level).toBe("Extremely poor");
  });

  it("escalates the advice as air quality worsens", () => {
    expect(europeanAqiLevel(10).advice).toContain("fine");
    expect(europeanAqiLevel(90).advice).toContain("Avoid outdoor exercise");
    expect(europeanAqiLevel(200).advice).toContain("Stay indoors");
  });

  it("handles missing data without claiming good air", () => {
    const unknown = europeanAqiLevel(Number.NaN);
    expect(unknown.level).toBe("Unknown");
    expect(unknown.advice).toContain("unavailable");
  });
});

describe("openMeteoAirProvider", () => {
  it("has correct metadata", () => {
    expect(openMeteoAirProvider.name).toBe("openmeteo-air");
    expect(openMeteoAirProvider.config.requiresKey).toBe(false);
    expect(openMeteoAirProvider.config.baseUrl).toContain("air-quality-api.open-meteo.com");
  });

  it("maps a station reading into an AQI band plus pollutants", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 })));

    const reading = await openMeteoAirProvider.readAirQuality(28.6139, 77.209);

    expect(reading).not.toBeNull();
    expect(reading!.aqi.european_aqi).toBe(168);
    expect(reading!.aqi.level).toBe("Extremely poor");
    expect(reading!.pollutants.pm2_5).toBe(96.4);
    expect(reading!.pollutants.pm10).toBe(150.2);
    expect(reading!.location).toEqual({ lat: 28.6, lon: 77.2 });
    expect(reading!.provenance.license).toBe("CC BY 4.0");
  });

  it("rejects out-of-range coordinates without calling upstream", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 }));
    vi.stubGlobal("fetch", spy);

    expect(await openMeteoAirProvider.readAirQuality(91, 0)).toBeNull();
    expect(await openMeteoAirProvider.readAirQuality(0, 181)).toBeNull();
    expect(await openMeteoAirProvider.readAirQuality(Number.NaN, 77)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns null when the upstream is unreachable, so the route can answer 503", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    expect(await openMeteoAirProvider.readAirQuality(28.6, 77.2)).toBeNull();
  });

  it("search returns at most one reading for the requested coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(FIXTURE), { status: 200 })));
    const result = await openMeteoAirProvider.search({ query: "", filters: { lat: "28.6139", lon: "77.209" } });
    expect(result.data).toHaveLength(1);
    expect(result.live).toBe(true);
  });
});
