/**
 * Real-time health data layer.
 * All fetchers hit free, keyless public APIs server-side with timeouts,
 * short in-memory caching, and graceful fallbacks (live:false) so the
 * site never breaks when an upstream source is down.
 */

export type CityPulse = {
  city: string;
  tempC: number | null;
  feelsLikeC: number | null;
  humidity: number | null;
  weatherCode: number | null;
  aqiUS: number | null;
  pm25: number | null;
  aqiLabel: string;
  advice: string;
  live: boolean;
  uvIndex: number | null;
  uvMax: number | null;
  sunrise: string | null;
  sunset: string | null;
  isDay: number | null;
};

export const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Delhi", lat: 28.61, lon: 77.23 },
  { name: "Mumbai", lat: 19.07, lon: 72.87 },
  { name: "Bengaluru", lat: 12.97, lon: 77.59 },
  { name: "Chennai", lat: 13.08, lon: 80.27 },
  { name: "Kolkata", lat: 22.57, lon: 88.36 },
  { name: "Hyderabad", lat: 17.38, lon: 78.48 },
  { name: "Ahmedabad", lat: 23.02, lon: 72.57 },
  { name: "Pune", lat: 18.52, lon: 73.85 },
];

export function aqiLabel(aqi: number | null): string {
  if (aqi == null) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

export function aqiAdvice(aqi: number | null): string {
  if (aqi == null) return "Air data unavailable — sensitive groups should check local advisories.";
  if (aqi <= 50) return "Great day for outdoor walks, yoga and exercise.";
  if (aqi <= 100) return "Fine for most; asthmatics should carry relievers on long outings.";
  if (aqi <= 150) return "Sensitive groups: shorten outdoor exercise, wear N95 in traffic.";
  if (aqi <= 200) return "Everyone: limit outdoor exertion; N95 outdoors; keep inhalers handy.";
  return "Avoid outdoor exercise; stay indoors with windows shut; seek care for breathlessness.";
}

export function weatherLabel(code: number | null): string {
  if (code == null) return "—";
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog / haze";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Drizzle / snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}

async function fetchJson(url: string, timeoutMs = 7000): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "BharatHealthGuide/1.0" } });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

// Simple in-memory cache shared across requests in the same instance.
const cache = new Map<string, { at: number; data: unknown }>();
function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data as T);
  return loader().then((data) => {
    // Don't remember failures: an upstream blip shouldn't hide results for the whole TTL.
    if (data !== null) cache.set(key, { at: Date.now(), data });
    return data;
  });
}

type OpenMeteoCurrent = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    uv_index?: number;
    is_day?: number;
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
};
type OpenMeteoAir = { current?: { us_aqi?: number; pm2_5?: number; pm10?: number } };

export function uvLabel(uv: number | null): string {
  if (uv == null) return "Unknown";
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very high";
  return "Extreme";
}

export function uvAdvice(uv: number | null): string {
  if (uv == null) return "UV data unavailable.";
  if (uv <= 2) return "Low risk — safe outdoors.";
  if (uv <= 5) return "Moderate — wear sunglasses, SPF 30+ if out >30 min.";
  if (uv <= 7) return "High — hat, sunglasses, SPF 50, seek shade midday.";
  if (uv <= 10) return "Very high — minimize 11am–4pm sun, full protection.";
  return "Extreme — avoid midday sun, full cover required.";
}

/**
 * Open-Meteo is called with timezone=Asia/Kolkata, so it returns IST wall-clock time
 * without an offset ("2026-10-02T06:14"). Parsing that with new Date() treats it as the
 * server's zone (UTC on Vercel) and shifts it by 5h30m — so read the clock digits directly.
 */
export function formatTimeIST(local: string | null): string | null {
  const m = /T(\d{2}):(\d{2})/.exec(local ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}

async function fetchCity(city: { name: string; lat: number; lon: number }): Promise<CityPulse> {
  const [w, a] = await Promise.all([
    fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,uv_index,is_day&daily=sunrise,sunset,uv_index_max&timezone=Asia%2FKolkata`
    ) as Promise<OpenMeteoCurrent | null>,
    fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5,pm10&timezone=Asia%2FKolkata`) as Promise<OpenMeteoAir | null>,
  ]);
  const aqi = a?.current?.us_aqi ?? null;
  const live = w?.current != null || a?.current != null;
  const sunriseRaw = w?.daily?.sunrise?.[0] ?? null;
  const sunsetRaw = w?.daily?.sunset?.[0] ?? null;
  return {
    city: city.name,
    tempC: w?.current?.temperature_2m ?? null,
    feelsLikeC: w?.current?.apparent_temperature ?? null,
    humidity: w?.current?.relative_humidity_2m ?? null,
    weatherCode: w?.current?.weather_code ?? null,
    aqiUS: aqi,
    pm25: a?.current?.pm2_5 ?? null,
    aqiLabel: aqiLabel(aqi),
    advice: aqiAdvice(aqi),
    live,
    uvIndex: w?.current?.uv_index ?? null,
    uvMax: w?.daily?.uv_index_max?.[0] ?? null,
    sunrise: formatTimeIST(sunriseRaw),
    sunset: formatTimeIST(sunsetRaw),
    isDay: w?.current?.is_day ?? null,
  };
}

export type IndiaPulse = {
  fetchedAt: string;
  istTime: string;
  season: string;
  seasonAdvice: string;
  cities: CityPulse[];
  liveSources: string[];
};

function seasonNow(date = new Date()): { season: string; advice: string } {
  const m = new Date(date.getTime() + 5.5 * 3600 * 1000).getUTCMonth(); // IST month, 0-based
  if (m === 11 || m === 0 || m === 1)
    return { season: "Winter (Shishira)", advice: "Smog season in North India: check AQI before morning walks; asthmatics keep relievers handy; moisturise skin; ensure vitamin D." };
  if (m >= 2 && m <= 5)
    return { season: "Summer (Grishma)", advice: "Heat-wave risk: hydrate with water + ORS on exertion days, avoid 12–4 PM sun, watch for heat exhaustion in elders and outdoor workers." };
  if (m >= 9)
    return { season: "Post-monsoon (Sharad)", advice: "Dengue and chikungunya peak after the rains: empty stagnant water weekly, use repellents, and see a doctor for high fever with body ache, rash or bleeding." };
  return { season: "Monsoon (Varsha)", advice: "Dengue/malaria season: empty stagnant water weekly, use repellents, drink safe water; seek care for high fever with rash or bleeding." };
}

function istClock(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date);
}

export function getIndiaPulse(): Promise<IndiaPulse> {
  return cached<IndiaPulse>("pulse-v3", 10 * 60 * 1000, async () => {
    const cities = await Promise.all(CITIES.map(fetchCity));
    const now = new Date();
    const s = seasonNow(now);
    const liveSources: string[] = [];
    if (cities.some((c) => c.live)) liveSources.push("Open-Meteo weather + air quality + UV + sunrise/sunset");
    return {
      fetchedAt: now.toISOString(),
      istTime: istClock(now),
      season: s.season,
      seasonAdvice: s.advice,
      cities,
      liveSources,
    };
  });
}

/* ---------- Drug info via US FDA (educational, always paired with our safety notes) ---------- */
export type DrugLive = {
  found: boolean;
  genericName: string;
  brandNames: string[];
  warnings: string[];
  live: boolean;
};

type DrugLabel = { openfda?: { generic_name?: string[]; brand_name?: string[] }; warnings?: string[]; boxed_warning?: string[] };

/**
 * openFDA's generic-name search also matches combination products ("sitagliptin and
 * metformin" for "metformin"), in arbitrary order. Prefer a label whose generic name is
 * the drug on its own, then the one with the fewest ingredients.
 */
export function pickDrugLabel<T extends DrugLabel>(results: T[], query: string): T | undefined {
  const q = query.trim().toLowerCase();
  const name = (r: T) => (r.openfda?.generic_name?.[0] ?? "").toLowerCase();
  const ingredients = (r: T) => name(r).split(/\s+and\s+|,\s*/).filter(Boolean).length || 99;
  const score = (r: T) => (name(r) === q || name(r).startsWith(`${q} `) ? 0 : 1) * 100 + ingredients(r);
  return [...results].filter((r) => name(r)).sort((a, b) => score(a) - score(b))[0];
}

export async function getDrugLive(query: string): Promise<DrugLive> {
  const q = query.trim().toLowerCase().slice(0, 60);
  if (!q) return { found: false, genericName: query, brandNames: [], warnings: [], live: false };
  return cached<DrugLive>(`drug-v2-${q}`, 60 * 60 * 1000, async () => {
    const d = (await fetchJson(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(q)}%22&limit=20`)) as {
      results?: DrugLabel[];
    } | null;
    const r = pickDrugLabel(d?.results ?? [], q);
    if (!r) return { found: false, genericName: query, brandNames: [], warnings: [], live: true };
    const warnings = [...(r.boxed_warning ?? []), ...(r.warnings ?? [])]
      .map((w) => w.replace(/\s+/g, " ").trim().slice(0, 600))
      .filter(Boolean)
      .slice(0, 3);
    return {
      found: true,
      genericName: r.openfda?.generic_name?.[0] ?? query,
      brandNames: (r.openfda?.brand_name ?? []).slice(0, 6),
      warnings,
      live: true,
    };
  });
}

/* ---------- Packaged-food lookup via Open Food Facts ---------- */
export type FoodLive = {
  found: boolean;
  name: string;
  brand: string;
  nutriScore: string | null;
  nova: number | null;
  nutrients: { energyKcal?: number; sugars?: number; fat?: number; satFat?: number; sodium?: number; fiber?: number; protein?: number };
  image: string | null;
  verdict: string;
  live: boolean;
};

export async function searchFoodLive(query: string): Promise<FoodLive | null> {
  const q = query.trim().slice(0, 60);
  if (!q) return null;
  return cached<FoodLive | null>(`food3-${q.toLowerCase()}`, 60 * 60 * 1000, async () => {
    // Open Food Facts' search service (the old cgi/search.pl now returns HTML). Prefer
    // products sold in India and ones with a Nutri-Score, then fetch the full record.
    type Hit = { code?: string; product_name?: string; nutrition_grades?: string };
    const search = async (extra: string) =>
      ((await fetchJson(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}${extra}&page_size=10&fields=code,product_name,nutrition_grades`)) as { hits?: Hit[] } | null)?.hits ?? [];
    let hits = await search(encodeURIComponent(' countries_tags:"en:india"'));
    if (!hits.length) hits = await search("");
    const usable = hits.filter((x) => x.code && x.product_name && x.product_name.trim().length > 1);
    const hit = usable.find((x) => /^[a-e]$/.test(x.nutrition_grades ?? "")) ?? usable[0];
    if (!hit?.code) return null;
    const full = (await fetchJson(
      `https://world.openfoodfacts.org/api/v0/product/${hit.code}.json?fields=product_name,brands,nutrition_grades,nova_group,nutriments,image_url`,
      9000
    )) as {
      status?: number; product?: { product_name?: string; brands?: string; nutrition_grades?: string; nova_group?: number; image_url?: string; nutriments?: Record<string, number> };
    } | null;
    const p = full?.status === 1 && full.product ? full.product : { product_name: hit.product_name, brands: undefined as string | undefined };
    if (!p.product_name) return null;
    const n = p.nutriments ?? {};
    const rawGrade = (p.nutrition_grades ?? "").toUpperCase();
    const grade = ["A", "B", "C", "D", "E"].includes(rawGrade) ? rawGrade : "";
    const verdict =
      grade === "A" || grade === "B"
        ? "Better packaged choice — still check sugar and sodium per 100 g."
        : grade === "C"
          ? "Middle of the road — fine occasionally in small portions."
          : grade === "D" || grade === "E"
            ? "Limit: typically high in sugar, salt or saturated fat. Prefer whole-food alternatives."
            : "No Nutri-Score — compare sugar, sodium and fat per 100 g on the label.";
    return {
      found: true,
      name: p.product_name,
      brand: p.brands ?? "",
      nutriScore: grade || null,
      nova: p.nova_group ?? null,
      nutrients: {
        energyKcal: n["energy-kcal_100g"], sugars: n.sugars_100g, fat: n.fat_100g,
        satFat: n["saturated-fat_100g"], sodium: n.sodium_100g, fiber: n.fiber_100g, protein: n.proteins_100g,
      },
      image: p.image_url ?? null,
      verdict,
      live: true,
    };
  });
}
