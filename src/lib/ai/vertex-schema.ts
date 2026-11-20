// Plain module (no "server-only") so GitHub Action scripts can use it too.

const KEEP = new Set(["type", "properties", "required", "items", "enum", "description", "minItems", "maxItems", "nullable", "format"]);

/** Vertex's responseSchema takes a smaller set of keys than JSON Schema, with upper-case types. */
export function toVertexSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toVertexSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (!KEEP.has(k)) continue;
    if (k === "type" && typeof v === "string") out.type = v.toUpperCase();
    else if (k === "properties" && v && typeof v === "object") out.properties = Object.fromEntries(Object.entries(v).map(([p, s]) => [p, toVertexSchema(s)]));
    else if (k === "items") out.items = toVertexSchema(v);
    else out[k] = v;
  }
  return out;
}

// Google retires Vertex AI model versions on a schedule (Gemini 2.5 and Imagen went in Oct 2026),
// so every caller tries these in order and moves to the next one on "model not found" (404).
// VERTEX_MODEL / MODEL / IMAGE_MODEL / VIDEO_MODEL still win when set.
export const TEXT_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3-flash", "gemini-3-flash-preview", "gemini-2.5-flash"];
export const PRO_MODELS = ["gemini-3.8-pro", "gemini-3.5-pro", "gemini-3-pro", "gemini-3-pro-preview", ...TEXT_MODELS];
export const IMAGE_MODELS = ["gemini-3.5-flash-image", "gemini-3-pro-image", "gemini-3-pro-image-preview", "gemini-3-flash-image", "gemini-2.5-flash-image"];
export const VIDEO_MODELS = ["veo-3.1-fast-generate-001", "veo-3.1-generate-001", "veo-3.1-fast-generate-preview", "veo-3.0-fast-generate-001"];

/** The override first (if any), then the defaults, without repeats. */
export const modelOrder = (override: string | undefined, defaults: string[]) => [...new Set([override?.trim(), ...defaults].filter((m): m is string => Boolean(m)))];

/**
 * Runs `call` with each model in turn until one is not a 404. Returns the first non-404 result
 * and the model that produced it, or the last 404.
 */
export async function withModelFallback<T extends { status: number }>(models: string[], call: (model: string) => Promise<T>): Promise<{ model: string; result: T }> {
  let last: { model: string; result: T } | null = null;
  for (const model of models) {
    const result = await call(model);
    last = { model, result };
    if (result.status !== 404) return last;
  }
  return last!;
}
