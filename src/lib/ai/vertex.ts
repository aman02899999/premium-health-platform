import "server-only";

/**
 * Gemini on Vertex AI, used when the site runs on Google Cloud Run.
 *
 * No API key: Cloud Run signs the call with its own service account through the metadata server.
 * Vertex AI usage is billed to the Google Cloud account (the free-trial credit pays for it;
 * Gemini bought through AI Studio would not be).
 */

export type Fetch = typeof fetch;
type Env = Record<string, string | undefined>;

const METADATA = "http://metadata.google.internal/computeMetadata/v1";
const API = "https://aiplatform.googleapis.com/v1";

/** On inside Cloud Run (K_SERVICE is set there). VERTEX_AI=off switches it off. */
export const vertexConfigured = (env: Env = process.env) => env.VERTEX_AI !== "off" && Boolean(env.K_SERVICE);

/** The stable Flash model unless VERTEX_MODEL names another. */
export const vertexModel = (env: Env = process.env) => env.VERTEX_MODEL?.trim() || "gemini-2.5-flash";

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

let token: { value: string; until: number } | null = null;
let project: string | null = null;

async function metadata(path: string, f: Fetch): Promise<Response> {
  const res = await f(`${METADATA}/${path}`, { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`metadata server ${res.status}`);
  return res;
}

async function credentials(f: Fetch): Promise<{ token: string; project: string }> {
  if (!project) project = (await (await metadata("project/project-id", f)).text()).trim();
  if (!token || token.until < Date.now()) {
    const t = (await (await metadata("instance/service-accounts/default/token", f)).json()) as { access_token: string; expires_in: number };
    token = { value: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
  }
  return { token: token.value, project };
}

export type JsonResult = { ok: true; raw: unknown } | { ok: false; error: string };

/** One Gemini call that must answer with JSON matching `schema`. Never throws. */
export async function geminiJson(
  req: { system: string; prompt: string; schema: unknown; maxTokens?: number },
  f: Fetch = fetch,
  env: Env = process.env,
): Promise<JsonResult> {
  try {
    const c = await credentials(f);
    const url = `${API}/projects/${c.project}/locations/global/publishers/google/models/${vertexModel(env)}:generateContent`;
    const res = await f(url, {
      method: "POST",
      headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: toVertexSchema(req.schema),
          maxOutputTokens: req.maxTokens ?? 4000,
          temperature: 0.4,
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    if (!res.ok) {
      const msg = json.error?.message ?? "no details";
      const hint = res.status === 403 ? " (give the Cloud Run service account the Vertex AI User role, and turn on the Vertex AI API)" : "";
      return { ok: false, error: `Gemini (${res.status}): ${msg}${hint}`.slice(0, 300) };
    }
    if (json.promptFeedback?.blockReason) return { ok: false, error: `The AI declined this (${json.promptFeedback.blockReason})` };
    const cand = json.candidates?.[0];
    const reason = cand?.finishReason ?? "";
    const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (reason && reason !== "STOP" && reason !== "MAX_TOKENS" && !text) return { ok: false, error: `The AI declined this (${reason})` };
    if (reason === "MAX_TOKENS") return { ok: false, error: "Gemini ran out of room before finishing" };
    return { ok: true, raw: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: `Gemini: ${(err as Error).message}`.slice(0, 200) };
  }
}
