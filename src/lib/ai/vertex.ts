import "server-only";
import { modelOrder, TEXT_MODELS, toVertexSchema, withModelFallback } from "./vertex-schema";

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

/** Models to try, newest first; VERTEX_MODEL goes first when set. */
export const vertexModels = (env: Env = process.env) => modelOrder(env.VERTEX_MODEL, TEXT_MODELS);

/** The model that last answered, so later calls skip retired ones. */
let working: string | null = null;

export { toVertexSchema };

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
  models?: string[],
): Promise<JsonResult> {
  try {
    const c = await credentials(f);
    const order = working && !models ? [working, ...vertexModels(env)] : (models ?? vertexModels(env));
    const { model, result: res } = await withModelFallback([...new Set(order)], (m) =>
      f(`${API}/projects/${c.project}/locations/global/publishers/google/models/${m}:generateContent`, {
        method: "POST",
        headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts: [{ text: req.prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: toVertexSchema(req.schema),
            maxOutputTokens: req.maxTokens ?? 8000,
            temperature: 0.4,
          },
        }),
      }),
    );
    if (res.ok) working = model;
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    if (!res.ok) {
      const msg = json.error?.message ?? "no details";
      const hint = res.status === 404 ? ` (tried ${order.join(", ")}: set VERTEX_MODEL to a current Gemini model)` : res.status === 403 ? " (give the Cloud Run service account the Vertex AI User role, and turn on the Vertex AI API)" : "";
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
