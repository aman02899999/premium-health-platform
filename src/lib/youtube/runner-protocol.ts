import type { UploadResult } from "./client";

export type RunnerRequest =
  | { action: "claim"; slot: number }
  | { action: "result"; id: string; result: UploadResult }
  | { action: "claim-long" }
  | { action: "result-long"; id: string; result: UploadResult };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max: number) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : null);

/** Checks the GitHub runner's request body before anything touches the database. */
export function parseRunnerRequest(body: unknown, slots: readonly number[]): { ok: true; value: RunnerRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "JSON body required" };
  const b = body as Record<string, unknown>;
  if (b.action === "claim") {
    return typeof b.slot === "number" && slots.includes(b.slot) ? { ok: true, value: { action: "claim", slot: b.slot } } : { ok: false, error: "Unknown slot" };
  }
  if (b.action === "claim-long") return { ok: true, value: { action: "claim-long" } };
  if (b.action === "result" || b.action === "result-long") {
    const action = b.action;
    if (typeof b.id !== "string" || !UUID.test(b.id)) return { ok: false, error: "Bad id" };
    const r = b.result as Record<string, unknown> | null;
    if (!r || typeof r !== "object") return { ok: false, error: "Bad result" };
    if (r.ok === true) {
      const id = str(r.id, 64), privacy = str(r.privacy, 20), url = str(r.url, 200);
      if (!id || !privacy || !url || !/^[\w-]+$/.test(id) || !url.startsWith("https://youtube.com/")) return { ok: false, error: "Bad result" };
      return { ok: true, value: { action, id: b.id, result: { ok: true, id, privacy, url } } };
    }
    if (r.ok === false) {
      const error = typeof r.error === "string" ? r.error.slice(0, 300) : "Runner failed";
      return { ok: true, value: { action, id: b.id, result: { ok: false, error, quota: r.quota === true } } };
    }
    return { ok: false, error: "Bad result" };
  }
  return { ok: false, error: "Unknown action" };
}
