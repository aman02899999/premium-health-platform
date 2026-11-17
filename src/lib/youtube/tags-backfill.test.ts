import { describe, expect, it } from "vitest";
import { backfillTags, cleanTag, isoSeconds, mergeTags, needsTags, tagsFromTitle, TAG_BUDGET } from "./tags-backfill";
import { LONG_VIDEOS, longVideoTags } from "./long-videos";
import { SHORTS } from "./shorts-bank";
import { shortTags } from "./shorts-core";

const cost = (t: string[]) => t.reduce((a, x) => a + x.length + (x.includes(" ") ? 2 : 0) + 1, 0);

type Call = { url: string; init?: RequestInit };
function fakeYoutube(videos: { id: string; title: string; tags?: string[]; duration?: string }[], update: (body: unknown) => { status: number; json?: unknown } = () => ({ status: 200 })) {
  const calls: Call[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const json = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { "content-type": "application/json" } });
    if (url.includes("/channels?")) return json({ items: [{ contentDetails: { relatedPlaylists: { uploads: "UU1" } } }] });
    if (url.includes("/playlistItems?")) {
      const second = url.includes("pageToken=p2");
      const ids = videos.map((v) => v.id);
      const page = second ? ids.slice(1) : ids.slice(0, 1);
      return json({ items: page.map((videoId) => ({ contentDetails: { videoId } })), nextPageToken: second || ids.length < 2 ? undefined : "p2" });
    }
    if (url.includes("/videos?part=snippet,contentDetails")) {
      const want = new URL(url).searchParams.get("id")!.split(",");
      return json({ items: videos.filter((v) => want.includes(v.id)).map((v) => ({ id: v.id, snippet: { title: v.title, description: "d", categoryId: "17", tags: v.tags, defaultLanguage: "en" }, contentDetails: { duration: v.duration ?? "PT1M5S" } })) });
    }
    if (url.includes("/videos?part=snippet") && init?.method === "PUT") {
      const r = update(JSON.parse(String(init.body)));
      return json(r.json ?? {}, r.status);
    }
    return json({}, 404);
  }) as typeof fetch;
  return { f, calls };
}

describe("tags", () => {
  it("cleans tags YouTube would reject", () => {
    expect(cleanTag(" a, <b>  c ")).toBe("a b c");
    expect(cleanTag("x".repeat(150))).toHaveLength(100);
  });
  it("merges uniquely and stays inside the budget", () => {
    expect(mergeTags(["Gym", "fitness"], ["gym", "noida"])).toEqual(["Gym", "fitness", "noida"]);
    const many = mergeTags(Array.from({ length: 200 }, (_, i) => `tag number ${i}`));
    expect(cost(many)).toBeLessThanOrEqual(TAG_BUDGET);
  });
  it("every scripted video has valid tags within YouTube's limit", () => {
    for (const t of [...LONG_VIDEOS.map(longVideoTags), ...SHORTS.map(shortTags)]) {
      expect(t.length).toBeGreaterThan(5);
      expect(cost(t)).toBeLessThanOrEqual(500);
      for (const x of t) expect(cleanTag(x)).toBe(x);
    }
  });
  it("makes tags from a title for videos we didn't script", () => {
    const t = tagsFromTitle("Creatine Kidney Kharab Karta Hai? Sach!", true);
    expect(t[0]).toBe("creatine kidney kharab karta");
    expect(t).toContain("Royal Fitness Club");
    expect(t).toContain("shorts");
    expect(tagsFromTitle("Long video", false)).not.toContain("shorts");
  });
  it("needsTags ignores case and extra tags", () => {
    expect(needsTags(undefined, ["a"])).toBe(true);
    expect(needsTags(["A", "z"], ["a"])).toBe(false);
  });
  it("reads ISO durations", () => {
    expect(isoSeconds("PT1M5S")).toBe(65);
    expect(isoSeconds("PT4M3S")).toBe(243);
    expect(isoSeconds("PT1H")).toBe(3600);
    expect(isoSeconds(undefined)).toBe(0);
  });
});

describe("backfillTags", () => {
  it("adds missing tags, keeps existing ones and the rest of the snippet", async () => {
    const bodies: { id: string; snippet: Record<string, unknown> }[] = [];
    const { f } = fakeYoutube(
      [
        { id: "v1", title: "Ours" },
        { id: "v2", title: "Done", tags: ["a", "b"] },
        { id: "v3", title: "Hand upload", tags: ["mine"], duration: "PT10M" },
      ],
      (b) => (bodies.push(b as never), { status: 200 }),
    );
    const r = await backfillTags("tok", (id) => (id === "v1" ? ["x", "y"] : id === "v2" ? ["a", "b"] : null), {}, f);
    expect(r.ok && r.report).toMatchObject({ total: 3, missing: 2, updated: 2, failed: 0, left: 0, untagged: ["v1"] });
    expect(bodies[0]).toEqual({ id: "v1", snippet: { title: "Ours", description: "d", categoryId: "17", tags: ["x", "y"], defaultLanguage: "en" } });
    expect(bodies[1].snippet.tags).toEqual(expect.arrayContaining(["mine", "hand upload", "Royal Fitness Club"]));
    expect(bodies[1].snippet.tags).not.toContain("shorts");
    expect((bodies[1].snippet.tags as string[])[0]).toBe("mine");
  });
  it("dry run changes nothing", async () => {
    const { f, calls } = fakeYoutube([{ id: "v1", title: "Ours" }]);
    const r = await backfillTags("tok", () => ["x"], { dry: true }, f);
    expect(r.ok && r.report).toMatchObject({ missing: 1, updated: 0, left: 1 });
    expect(calls.some((c) => c.init?.method === "PUT")).toBe(false);
  });
  it("stops and asks for a reconnect when the token can't edit videos", async () => {
    const { f, calls } = fakeYoutube(
      [
        { id: "v1", title: "One" },
        { id: "v2", title: "Two" },
      ],
      () => ({ status: 403, json: { error: { message: "Request had insufficient authentication scopes.", errors: [{ reason: "insufficientPermissions" }] } } }),
    );
    const r = await backfillTags("tok", () => ["x"], {}, f);
    expect(r.ok && r.report).toMatchObject({ updated: 0, failed: 1, left: 2, stopped: "reconnect" });
    expect(calls.filter((c) => c.init?.method === "PUT")).toHaveLength(1);
  });
  it("respects the per-run cap", async () => {
    const { f } = fakeYoutube([
      { id: "v1", title: "One" },
      { id: "v2", title: "Two" },
    ]);
    const r = await backfillTags("tok", () => ["x"], { max: 1 }, f);
    expect(r.ok && r.report).toMatchObject({ updated: 1, left: 1 });
  });
  it("reports a listing failure", async () => {
    const f = (async () => new Response(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }] } }), { status: 403 })) as unknown as typeof fetch;
    expect(await backfillTags("tok", () => null, {}, f)).toEqual({ ok: false, error: "quotaExceeded" });
  });
});
