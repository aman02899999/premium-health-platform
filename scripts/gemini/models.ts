// Lists Google's Vertex AI models whose names contain `match`, for the job summary when every
// model we tried has been retired. Best effort: returns a note instead of throwing.
export async function listModels(token: string, match: string): Promise<string> {
  try {
    const res = await fetch("https://aiplatform.googleapis.com/v1beta1/publishers/google/models?pageSize=300&listAllVersions=true", {
      headers: { authorization: `Bearer ${token}`, "x-goog-user-project": process.env.GCP_PROJECT_ID ?? "" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return `(model list HTTP ${res.status})`;
    const json = (await res.json()) as { publisherModels?: { name?: string; versionId?: string }[] };
    const names = (json.publisherModels ?? []).map((m) => (m.name ?? "").split("/").pop() ?? "").filter((n) => n.includes(match));
    return names.length ? [...new Set(names)].join(", ") : "(none listed)";
  } catch (e) {
    return `(model list failed: ${(e as Error).message})`;
  }
}
