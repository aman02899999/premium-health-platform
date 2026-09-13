/**
 * Public developer API surface — single source of truth.
 *
 * Both /developers/docs (the human reference) and /api/v1/openapi.json (the
 * machine-readable spec) are generated from this list, so an endpoint cannot be
 * documented without existing or exist without being documented.
 */

import { API_PLANS } from "./plans";

export type EndpointAuth = "api_key" | "session" | "public";

export type ApiParam = {
  name: string;
  type: "string" | "integer" | "number";
  required: boolean;
  description: string;
  example?: string;
};

export type ApiEndpoint = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  title: string;
  summary: string;
  auth: EndpointAuth;
  params: ApiParam[];
  /** Upstream data source, when the endpoint proxies a public API. */
  source?: { name: string; url: string; license: string };
  /** Request body properties for POST endpoints, rendered into the OpenAPI document. */
  body?: { required: boolean; properties: Record<string, Record<string, unknown>> };
  sample?: unknown;
};

const q = (description: string, example: string, name = "q", required = true): ApiParam => ({
  name,
  type: "string",
  required,
  description,
  example,
});

const limitParam = (max: number, def = 10): ApiParam => ({
  name: "limit",
  type: "integer",
  required: false,
  description: `Number of results to return (1–${max}, default ${def}).`,
  example: String(def),
});

export const API_ENDPOINTS: readonly ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/food/search",
    title: "Food search",
    summary: "Search packaged and branded foods with per-100g nutrition, Nutri-Score and NOVA group.",
    auth: "api_key",
    params: [q("Food name or brand", "millet"), limitParam(20)],
    source: {
      name: "Open Food Facts + USDA FoodData Central",
      url: "https://world.openfoodfacts.org/data",
      license: "ODbL + DBCL (USDA: public domain)",
    },
    sample: {
      results: [{ id: "8901491101727", name: "Ragi Flour", nutrients: { calories: 328, protein: 7.3 } }],
      total: 42,
    },
  },
  {
    method: "GET",
    path: "/api/v1/exercises",
    title: "Exercise library",
    summary: "Strength and mobility exercises with muscles, equipment and instructions.",
    auth: "api_key",
    params: [q("Exercise, muscle or equipment", "squat"), limitParam(20)],
    source: { name: "wger Workout Manager", url: "https://wger.de/en/software/api", license: "AGPL-3.0" },
    sample: { results: [{ id: 123, name: "Barbell Squat", muscles: ["Quadriceps"] }] },
  },
  {
    method: "GET",
    path: "/api/v1/clinical-trials",
    title: "Clinical trials",
    summary: "Registered interventional and observational trials, with phase, status and locations.",
    auth: "api_key",
    params: [q("Condition or intervention", "diabetes"), limitParam(20)],
    source: {
      name: "ClinicalTrials.gov",
      url: "https://clinicaltrials.gov/data-api/api",
      license: "Public domain (US NLM)",
    },
    sample: { results: [{ nctId: "NCT01234567", title: "…", phase: "PHASE3" }] },
  },
  {
    method: "GET",
    path: "/api/v1/literature/search",
    title: "Medical literature search",
    summary: "Peer-reviewed life-science literature with abstracts, journal, year and citation counts.",
    auth: "api_key",
    params: [q("Search terms (PICO-style supported)", "millet glycemic control"), limitParam(25)],
    source: {
      name: "Europe PMC",
      url: "https://europepmc.org/RestfulWebService",
      license: "Open (Europe PMC terms; abstracts per publisher)",
    },
    sample: {
      results: [{ id: "MED:12345678", title: "…", journal: "Lancet", year: 2024, citedByCount: 12 }],
      total: 128,
    },
  },
  {
    method: "GET",
    path: "/api/v1/scholarly/search",
    title: "Scholarly works",
    summary: "Open scholarly catalogue: works, authors, institutions and open-access links.",
    auth: "api_key",
    params: [q("Topic, title or author", "intermittent fasting insulin"), limitParam(25)],
    source: { name: "OpenAlex", url: "https://docs.openalex.org", license: "CC0 1.0" },
    sample: { results: [{ id: "W2741809807", title: "…", year: 2023, citedByCount: 88 }] },
  },
  {
    method: "GET",
    path: "/api/v1/nutrition/fruit",
    title: "Fruit nutrition",
    summary: "Per-100g energy, sugar, fibre and micronutrients for fruits.",
    auth: "api_key",
    params: [q("Fruit name", "mango", "name", true)],
    source: { name: "Fruityvice", url: "https://www.fruityvice.com", license: "Open data" },
    sample: { name: "Mango", nutrients: { calories: 60, carbohydrates: 15, sugar: 13.7 } },
  },
  {
    method: "GET",
    path: "/api/v1/air-quality",
    title: "Air quality",
    summary: "Current PM2.5, PM10, ozone, NO2 and European AQI for any coordinate — health advisories included.",
    auth: "api_key",
    params: [
      { name: "lat", type: "number", required: true, description: "Latitude (-90…90).", example: "28.6139" },
      { name: "lon", type: "number", required: true, description: "Longitude (-180…180).", example: "77.2090" },
    ],
    source: { name: "Open-Meteo Air Quality", url: "https://open-meteo.com/en/docs/air-quality-api", license: "CC BY 4.0 (non-commercial tiers)" },
    sample: { location: { lat: 28.6139, lon: 77.209 }, aqi: { european_aqi: 168, level: "Unhealthy" }, pollutants: { pm2_5: 96.4 } },
  },
  {
    method: "GET",
    path: "/api/v1/indicators",
    title: "Health indicators",
    summary: "Country-level health and development indicators (life expectancy, health spend, mortality).",
    auth: "api_key",
    params: [
      { name: "country", type: "string", required: false, description: "ISO-2 country code (default IN).", example: "IN" },
      { name: "indicator", type: "string", required: false, description: "World Bank indicator code.", example: "SP.DYN.LE00.IN" },
    ],
    source: { name: "World Bank Open Data", url: "https://data.worldbank.org", license: "CC BY 4.0" },
    sample: { country: "IN", indicator: "SP.DYN.LE00.IN", value: 70.4, year: 2023 },
  },
  {
    method: "GET",
    path: "/api/v1/providers",
    title: "Provider directory",
    summary: "Every upstream data provider this API aggregates, with capabilities, licence and live status.",
    auth: "api_key",
    params: [],
    sample: { providers: [{ name: "openfoodfacts", status: "AVAILABLE", requiresKey: false }] },
  },
  {
    method: "GET",
    path: "/api/v1/usage",
    title: "Usage & quota",
    summary: "Current quota consumption for the key used on the request, with per-endpoint breakdown.",
    auth: "api_key",
    params: [],
    sample: { requestsToday: 42, remainingToday: 958, resetsAt: "2026-09-14T00:00:00.000Z" },
  },
  {
    method: "GET",
    path: "/api/v1/plans",
    title: "Plans & pricing",
    summary: "Plan catalogue with quotas and prices — public, no key required.",
    auth: "public",
    params: [],
  },
  {
    method: "GET",
    path: "/api/v1/keys",
    title: "List API keys",
    summary: "List the signed-in account's keys (prefixes only — plaintext keys are never returned).",
    auth: "session",
    params: [],
  },
  {
    method: "POST",
    path: "/api/v1/keys",
    title: "Create API key",
    summary: "Create a key for the signed-in account. The plaintext key is returned exactly once.",
    auth: "session",
    params: [],
  },
  {
    method: "DELETE",
    path: "/api/v1/keys/{keyId}",
    title: "Revoke API key",
    summary: "Permanently revoke a key. Usage history is retained, the key stops working immediately.",
    auth: "session",
    params: [{ name: "keyId", type: "string", required: true, description: "Key identifier from the list endpoint.", example: "key_AbCdEfGhI" }],
  },
  {
    method: "GET",
    path: "/api/v1/billing/subscription",
    title: "Subscription & billing state",
    summary:
      "The signed-in account's effective plan, subscription history and whether the configured payment provider can attest a real charge. Reports mode: \"simulated\" when running on the sandbox provider.",
    auth: "session",
    params: [],
  },
  {
    method: "POST",
    path: "/api/v1/billing/checkout",
    title: "Start a subscription checkout",
    summary:
      "Creates a provider order and a pending (past_due) subscription for the Starter or Pro plan. Nothing is upgraded until the payment is verified, so an abandoned checkout cannot grant quota.",
    auth: "session",
    params: [],
    body: {
      required: true,
      properties: {
        plan: { type: "string", enum: ["starter", "pro"], example: "starter" },
      },
    },
  },
  {
    method: "POST",
    path: "/api/v1/billing/verify",
    title: "Settle a subscription payment",
    summary:
      "Verifies a payment with the provider and activates the subscription, upgrading every active key on the account. Refused unless the payment is attested (or the sandbox provider is explicitly in use, which is recorded as demo: true).",
    auth: "session",
    params: [],
    body: {
      required: true,
      properties: {
        subscriptionId: { type: "string", example: "sub_AbCdEfGhI" },
        paymentId: { type: "string", example: "pay_AbCdEfGhI" },
        signature: { type: "string", description: "Provider signature — required by Razorpay." },
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/billing/subscription",
    title: "Cancel a subscription",
    summary:
      "Cancels a subscription and returns the account's active keys to the Free plan. Defaults to the account's active subscription when subscriptionId is omitted.",
    auth: "session",
    params: [
      {
        name: "subscriptionId",
        type: "string",
        required: false,
        description: "Subscription to cancel. Omit to cancel the active one.",
        example: "sub_AbCdEfGhI",
      },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/openapi.json",
    title: "OpenAPI specification",
    summary: "OpenAPI 3.1 document describing this entire API — public, no key required.",
    auth: "public",
    params: [],
  },
];

/** Builds an OpenAPI 3.1 document from the endpoint list above. */
export function openApiDocument(siteUrl: string) {
  const dataEndpoints = API_ENDPOINTS.filter((e) => e.source);

  const paths: Record<string, Record<string, unknown>> = {};
  for (const endpoint of API_ENDPOINTS) {
    const params = endpoint.params.map((p) => ({
      name: p.name,
      in: p.name === "keyId" ? "path" : "query",
      required: p.required,
      description: p.description,
      schema: { type: p.type, ...(p.example ? { example: p.type === "number" ? Number(p.example) : p.example } : {}) },
    }));

    const responses: Record<string, unknown> = {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", const: true },
                meta: {
                  type: "object",
                  properties: {
                    plan: { type: "string" },
                    quota: {
                      type: "object",
                      properties: {
                        requestsToday: { type: "integer" },
                        remainingToday: { type: ["integer", "string"] },
                        resetsAt: { type: "string", format: "date-time" },
                      },
                    },
                    generatedAt: { type: "string", format: "date-time" },
                  },
                },
                data: {},
              },
            },
          },
        },
      },
    };

    if (endpoint.auth === "api_key") {
      responses["401"] = {
        description: "Missing or invalid API key",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", const: false },
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", enum: ["missing_api_key", "invalid_api_key"] },
                    message: { type: "string" },
                    docs: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
        },
      };
      responses["429"] = {
        description: "Quota or burst limit exceeded (see the Retry-After header)",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean", const: false },
                error: {
                  type: "object",
                  properties: { code: { type: "string", enum: ["quota_exceeded", "rate_limited"] }, message: { type: "string" } },
                },
              },
            },
          },
        },
      };
    }

    if (endpoint.auth === "session") {
      responses["401"] = { description: "Sign in required" };
    }

    // Merge rather than replace: several paths expose more than one method
    // (GET+POST /api/v1/keys, GET+DELETE /api/v1/billing/subscription), and the
    // previous assignment silently dropped whichever operation came first.
    const pathKey = endpoint.path.replace(/\{([^}]+)\}/g, "{$1}");
    paths[pathKey] = {
      ...(paths[pathKey] ?? {}),
      [endpoint.method.toLowerCase()]: {
        summary: endpoint.title,
        description: `${endpoint.summary}${endpoint.source ? `\n\nSource: ${endpoint.source.name} (${endpoint.source.url}), licence: ${endpoint.source.license}.` : ""}`,
        tags: [endpoint.auth === "api_key" ? "Data" : endpoint.auth === "session" ? "Account" : "Public"],
        // The document-wide security requirement lists the API-key schemes, which
        // do not apply to cookie-authenticated account routes or public endpoints.
        // Stating it per operation keeps the spec usable by codegen clients.
        security:
          endpoint.auth === "api_key"
            ? [{ ApiKeyHeader: [] }, { BearerAuth: [] }]
            : endpoint.auth === "session"
              ? [{ SessionCookie: [] }]
              : [],
        ...(params.length ? { parameters: params } : {}),
        ...(endpoint.method === "POST"
          ? {
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: endpoint.body?.properties ?? {
                        name: { type: "string", example: "Production key" },
                        environment: { type: "string", enum: ["live", "test"] },
                        plan: { type: "string", enum: API_PLANS.map((p) => p.id) },
                      },
                      ...(endpoint.body?.required === false ? {} : { required: Object.keys(endpoint.body?.properties ?? {}) }),
                    },
                  },
                },
              },
            }
          : {}),
        responses,
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Bharat Health Guide Data API",
      version: "1.0.0",
      summary: "India-focused health and nutrition data aggregated from open, licence-clean sources.",
      description:
        "Aggregates open health data — foods and nutrition, exercises, clinical trials, medical literature, scholarly works, air quality and country health indicators — behind one authenticated API with per-plan quotas.\n\nAll upstream sources are open-licensed; see each endpoint for source and licence. Attribution to each upstream provider is required by their licences.",
      contact: { name: "Bharat Health Guide", url: `${siteUrl}/developers` },
      license: { name: "Aggregated open data — see per-endpoint source licences", url: `${siteUrl}/developers/docs` },
    },
    servers: [{ url: siteUrl, description: "Production" }],
    tags: [
      { name: "Data", description: "Authenticated data endpoints (x-api-key)" },
      { name: "Account", description: "Key management and billing for signed-in users (session cookie)" },
      { name: "Public", description: "No authentication required" },
    ],
    components: {
      securitySchemes: {
        ApiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
        BearerAuth: { type: "http", scheme: "bearer" },
        SessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "bhg_session",
          description: "Account console cookie — used by key management and billing endpoints, never by data endpoints.",
        },
      },
    },
    security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
    "x-data-endpoints": dataEndpoints.length,
    paths,
  };
}
