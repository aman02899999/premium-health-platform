import { describe, it, expect } from "vitest";
import { API_ENDPOINTS, openApiDocument } from "./endpoints";

const doc = openApiDocument("https://example.test") as {
  paths: Record<string, Record<string, unknown>>;
  components: { securitySchemes: Record<string, unknown> };
  security: unknown;
  tags: { name: string }[];
  "x-data-endpoints": number;
};

describe("endpoint catalogue", () => {
  it("has no duplicate path+method pairs", () => {
    const seen = new Set<string>();
    for (const endpoint of API_ENDPOINTS) {
      const key = `${endpoint.method} ${endpoint.path}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("documents every endpoint with a title and a summary", () => {
    for (const endpoint of API_ENDPOINTS) {
      expect(endpoint.title.length, `${endpoint.path} title`).toBeGreaterThan(0);
      expect(endpoint.summary.length, `${endpoint.path} summary`).toBeGreaterThan(20);
    }
  });

  it("attributes every endpoint that proxies upstream data", () => {
    for (const endpoint of API_ENDPOINTS.filter((e) => e.source)) {
      expect(endpoint.source!.name.length).toBeGreaterThan(0);
      expect(endpoint.source!.url).toMatch(/^https:\/\//);
      expect(endpoint.source!.license.length).toBeGreaterThan(0);
    }
  });
});

describe("openApiDocument", () => {
  it("includes every operation — including both methods of a shared path", () => {
    // Regression guard: the generator once assigned `paths[x] = {...}`, which
    // silently dropped the first operation on any path with two methods
    // (GET /api/v1/keys vanished from the published spec).
    for (const endpoint of API_ENDPOINTS) {
      const path = doc.paths[endpoint.path];
      expect(path, `missing path ${endpoint.path}`).toBeDefined();
      expect(path[endpoint.method.toLowerCase()], `missing ${endpoint.method} ${endpoint.path}`).toBeDefined();
    }
  });

  it("keeps the keys path usable by both key management methods", () => {
    expect(Object.keys(doc.paths["/health/api/v1/keys"]).sort()).toEqual(["get", "post"]);
    expect(Object.keys(doc.paths["/health/api/v1/billing/subscription"]).sort()).toEqual(["delete", "get"]);
  });

  it("publishes the document as OpenAPI 3.1 with security schemes", () => {
    const full = openApiDocument("https://example.test") as Record<string, unknown>;
    expect(full.openapi).toBe("3.1.0");
    expect(Object.keys(doc.components.securitySchemes)).toEqual(
      expect.arrayContaining(["ApiKeyHeader", "BearerAuth", "SessionCookie"])
    );
  });

  it("scopes authentication per operation instead of applying API keys to everything", () => {
    const data = doc.paths["/health/api/v1/literature/search"].get as { security: unknown[] };
    expect(data.security).toEqual([{ ApiKeyHeader: [] }, { BearerAuth: [] }]);

    const session = doc.paths["/health/api/v1/keys"].get as { security: unknown[] };
    expect(session.security).toEqual([{ SessionCookie: [] }]);

    const open = doc.paths["/health/api/v1/plans"].get as { security: unknown[] };
    expect(open.security).toEqual([]);
  });

  it("marks path-template parameters as path parameters", () => {
    const exportOp = doc.paths["/health/api/v1/export/{dataset}"].get as {
      parameters: { name: string; in: string; required: boolean }[];
    };
    const dataset = exportOp.parameters.find((p) => p.name === "dataset")!;
    expect(dataset.in).toBe("path");
    expect(dataset.required).toBe(true);

    const deleteKey = doc.paths["/health/api/v1/keys/{keyId}"].delete as {
      parameters: { name: string; in: string }[];
    };
    expect(deleteKey.parameters.find((p) => p.name === "keyId")!.in).toBe("path");

    // Non-path params stay query params.
    const literature = doc.paths["/health/api/v1/literature/search"].get as {
      parameters: { name: string; in: string }[];
    };
    expect(literature.parameters.every((p) => p.in === "query")).toBe(true);
  });

  it("documents quota and auth failures for keyed endpoints", () => {
    const keyed = doc.paths["/health/api/v1/food/search"].get as { responses: Record<string, unknown> };
    expect(Object.keys(keyed.responses)).toEqual(expect.arrayContaining(["200", "401", "429"]));

    // A public endpoint must not advertise quota errors it cannot produce.
    const publicOp = doc.paths["/health/api/v1/plans"].get as { responses: Record<string, unknown> };
    expect(Object.keys(publicOp.responses)).not.toContain("429");
  });

  it("uses generated request bodies for the billing and export endpoints", () => {
    const checkout = doc.paths["/health/api/v1/billing/checkout"].post as {
      requestBody: { content: { "application/json": { schema: { properties: Record<string, unknown>; required: string[] } } } };
    };
    const schema = checkout.requestBody.content["application/json"].schema;
    expect(Object.keys(schema.properties)).toContain("plan");
    expect(schema.required).toContain("plan");
  });

  it("counts the upstream-backed endpoints it advertises", () => {
    expect(doc["x-data-endpoints"]).toBe(API_ENDPOINTS.filter((e) => e.source).length);
    expect(doc["x-data-endpoints"]).toBeGreaterThanOrEqual(10);
  });
});
