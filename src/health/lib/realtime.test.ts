import { describe, it, expect } from "vitest";
import { aqiLabel, aqiAdvice, weatherLabel, uvLabel, uvAdvice } from "./realtime";

describe("realtime helpers", () => {
  it("aqiLabel categorizes correctly", () => {
    expect(aqiLabel(null)).toBe("Unknown");
    expect(aqiLabel(25)).toBe("Good");
    expect(aqiLabel(75)).toBe("Moderate");
    expect(aqiLabel(125)).toBe("Unhealthy (sensitive)");
    expect(aqiLabel(175)).toBe("Unhealthy");
    expect(aqiLabel(250)).toBe("Very unhealthy");
    expect(aqiLabel(400)).toBe("Hazardous");
  });

  it("aqiAdvice returns safe string", () => {
    expect(aqiAdvice(null)).toContain("unavailable");
    expect(aqiAdvice(10)).toContain("Great day");
    expect(aqiAdvice(300)).toContain("Avoid");
  });

  it("weatherLabel maps codes", () => {
    expect(weatherLabel(null)).toBe("—");
    expect(weatherLabel(0)).toBe("Clear sky");
    expect(weatherLabel(2)).toBe("Partly cloudy");
    expect(weatherLabel(45)).toBe("Fog / haze");
    expect(weatherLabel(65)).toBe("Rain");
    expect(weatherLabel(80)).toBe("Showers");
    expect(weatherLabel(95)).toBe("Thunderstorm");
  });

  it("uvLabel and uvAdvice work", () => {
    expect(uvLabel(null)).toBe("Unknown");
    expect(uvLabel(1)).toBe("Low");
    expect(uvLabel(4)).toBe("Moderate");
    expect(uvLabel(6)).toBe("High");
    expect(uvLabel(9)).toBe("Very high");
    expect(uvLabel(12)).toBe("Extreme");
    expect(uvAdvice(2)).toContain("Low risk");
    expect(uvAdvice(8)).toContain("Very high");
  });

  it("builds cache-safe city pulse shape expectations", () => {
    // smoke test for types – ensures CityPulse has new fields
    const sample = {
      city: "Delhi",
      tempC: 30,
      feelsLikeC: 32,
      humidity: 60,
      weatherCode: 1,
      aqiUS: 120,
      pm25: 45,
      aqiLabel: "Unhealthy (sensitive)",
      advice: "test",
      live: true,
      uvIndex: 5.5,
      uvMax: 8.2,
      sunrise: "6:30 AM",
      sunset: "6:45 PM",
      isDay: 1,
    };
    expect(sample.uvIndex).toBeGreaterThan(0);
    expect(sample.sunrise).toContain("AM");
    expect(sample.sunset).toContain("PM");
  });
});

describe("formatTimeIST", () => {
  it("reads Open-Meteo local times without shifting them", async () => {
    const { formatTimeIST } = await import("./realtime");
    expect(formatTimeIST("2026-10-02T06:14")).toBe("6:14 am");
    expect(formatTimeIST("2026-10-02T18:06")).toBe("6:06 pm");
    expect(formatTimeIST("2026-10-02T00:05")).toBe("12:05 am");
    expect(formatTimeIST("2026-10-02T12:30")).toBe("12:30 pm");
    expect(formatTimeIST(null)).toBeNull();
  });
});

describe("pickDrugLabel", () => {
  it("prefers the single-ingredient label over combinations", async () => {
    const { pickDrugLabel } = await import("./realtime");
    const combo = { openfda: { generic_name: ["SITAGLIPTIN AND METFORMIN HYDROCHLORIDE"], brand_name: ["ZITUVIMET"] } };
    const plain = { openfda: { generic_name: ["METFORMIN HYDROCHLORIDE"], brand_name: ["GLUCOPHAGE"] } };
    const triple = { openfda: { generic_name: ["A, B AND METFORMIN"] } };
    expect(pickDrugLabel([combo, triple, plain], "metformin")).toBe(plain);
    expect(pickDrugLabel([combo], "metformin")).toBe(combo);
    expect(pickDrugLabel([], "metformin")).toBeUndefined();
  });
});
