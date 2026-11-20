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
