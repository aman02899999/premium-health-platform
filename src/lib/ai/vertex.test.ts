import { describe, expect, it, vi } from "vitest";
import { geminiJson, toVertexSchema, vertexConfigured, vertexModel, type Fetch } from "./vertex";

vi.mock("server-only", () => ({}));

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "verdict"],
  properties: {
    answer: { type: "string" },
    verdict: { type: "string", enum: ["SACH", "JHOOTH"] },
    tips: { type: "array", items: { type: "string" } },
    source: { type: "object", additionalProperties: false, required: ["url"], properties: { url: { type: "string" } } },
  },
};

type Call = { url: string; init?: RequestInit };

/** A fake Cloud Run: the metadata server plus a scripted Vertex AI answer. */
function fakeCloud(answer: { status?: number; body: unknown }) {
  const calls: Call[] = [];
  const f: Fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/project/project-id")) return new Response("royal-test-project");
    if (url.endsWith("/service-accounts/default/token")) return Response.json({ access_token: "tok-1", expires_in: 3599 });
    return new Response(JSON.stringify(answer.body), { status: answer.status ?? 200 });
  };
  return { f, calls };
}

const textAnswer = (text: string, finishReason = "STOP") => ({ candidates: [{ finishReason, content: { parts: [{ text }] } }] });

describe("vertexConfigured", () => {
  it("is on only inside Cloud Run, and VERTEX_AI=off switches it off", () => {
    expect(vertexConfigured({ K_SERVICE: "royal-fitness-site" })).toBe(true);
    expect(vertexConfigured({})).toBe(false);
    expect(vertexConfigured({ K_SERVICE: "royal-fitness-site", VERTEX_AI: "off" })).toBe(false);
  });
});

describe("vertexModel", () => {
  it("defaults to the stable Flash model and can be overridden", () => {
    expect(vertexModel({})).toBe("gemini-2.5-flash");
    expect(vertexModel({ VERTEX_MODEL: "gemini-3-flash-preview" })).toBe("gemini-3-flash-preview");
  });
});

describe("toVertexSchema", () => {
  it("drops keys Vertex rejects and upper-cases the types, all the way down", () => {
    const s = toVertexSchema(SCHEMA) as Record<string, any>;
    expect(s.additionalProperties).toBeUndefined();
    expect(s.type).toBe("OBJECT");
    expect(s.required).toEqual(["answer", "verdict"]);
    expect(s.properties.verdict).toEqual({ type: "STRING", enum: ["SACH", "JHOOTH"] });
    expect(s.properties.tips).toEqual({ type: "ARRAY", items: { type: "STRING" } });
    expect(s.properties.source.additionalProperties).toBeUndefined();
    expect(s.properties.source.properties.url.type).toBe("STRING");
  });
});

describe("geminiJson", () => {
  it("signs in through the metadata server and returns the parsed JSON", async () => {
    const { f, calls } = fakeCloud({ body: textAnswer('{"answer":"Haan","verdict":"SACH"}') });
    const r = await geminiJson({ system: "sys", prompt: "q", schema: SCHEMA }, f, {});
    expect(r).toEqual({ ok: true, raw: { answer: "Haan", verdict: "SACH" } });

    const metadata = calls.filter((c) => c.url.startsWith("http://metadata.google.internal/"));
    expect(metadata.length).toBe(2);
    for (const m of metadata) expect((m.init?.headers as Record<string, string>)["Metadata-Flavor"]).toBe("Google");

    const api = calls.find((c) => c.url.startsWith("https://aiplatform.googleapis.com/"))!;
    expect(api.url).toBe("https://aiplatform.googleapis.com/v1/projects/royal-test-project/locations/global/publishers/google/models/gemini-2.5-flash:generateContent");
    expect((api.init?.headers as Record<string, string>).authorization).toBe("Bearer tok-1");
    const body = JSON.parse(String(api.init?.body));
    expect(body.systemInstruction.parts[0].text).toBe("sys");
    expect(body.contents[0]).toEqual({ role: "user", parts: [{ text: "q" }] });
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("OBJECT");
  });

  it("reports a safety block as declined, not as a draft", async () => {
    const { f } = fakeCloud({ body: textAnswer("", "SAFETY") });
    const r = await geminiJson({ system: "s", prompt: "q", schema: SCHEMA }, f, {});
    expect(r).toEqual({ ok: false, error: "The AI declined this (SAFETY)" });
  });

  it("explains a permission error in plain words", async () => {
    const { f } = fakeCloud({ status: 403, body: { error: { message: "Permission 'aiplatform.endpoints.predict' denied" } } });
    const r = await geminiJson({ system: "s", prompt: "q", schema: SCHEMA }, f, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^Gemini \(403\): .*Vertex AI User/);
  });

  it("returns an error, never throws, when the answer isn't JSON", async () => {
    const { f } = fakeCloud({ body: textAnswer("not json") });
    const r = await geminiJson({ system: "s", prompt: "q", schema: SCHEMA }, f, {});
    expect(r.ok).toBe(false);
  });

  it("returns an error when the metadata server can't be reached (not on Cloud Run)", async () => {
    const f: Fetch = async () => { throw new Error("getaddrinfo ENOTFOUND metadata.google.internal"); };
    const r = await geminiJson({ system: "s", prompt: "q", schema: SCHEMA }, f, {});
    expect(r.ok).toBe(false);
  });
});
