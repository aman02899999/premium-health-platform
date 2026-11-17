import { describe, expect, it } from "vitest";
import { commentText, descriptionWithLinks, DESC_MARKER, growChannel, PLAYLISTS, type Store } from "./engagement";
import { bestVideoFor, topicScores, videoText, videoTopics } from "./topics";
import { LONG_VIDEOS } from "./long-videos";
import type { ChannelVideo } from "./tags-backfill";

const LINKS = { instagram: "https://www.instagram.com/royalfitness93_/", igPage: "https://www.royalfitnesclub.in/ig?utm_source=youtube", phone: "88518 30081" };

describe("topics", () => {
  it("finds whole words only, in any case", () => {
    expect(topicScores("BP aur Heart ke myths").map((s) => s.key)).toEqual(["bp-heart", "myths"]);
    expect(topicScores("information")).toEqual([]);
    expect(topicScores("Diabetes Myths").map((s) => s.key)).toContain("diabetes");
  });
  it("ignores the gym's own tags when classifying a video", () => {
    expect(videoText("Sleep myths", ["noida gym", "royal fitness club", "sleep tips"])).toBe("Sleep myths · sleep tips");
    expect(videoTopics(videoText("Sleep myths", ["sector 93 noida gym"]))).toEqual(["sleep", "myths"]);
  });
  it("puts every scripted long video into at least one subject playlist", () => {
    for (const v of LONG_VIDEOS) expect(videoTopics(videoText(v.title, v.tags)).filter((k) => k !== "myths").length, v.id).toBeGreaterThan(0);
  });
  it("picks a video that shares a real subject word with the page, newest on a tie", () => {
    const c = [
      { id: "bp", text: "BP aur Heart ke 8 myths · high blood pressure · hypertension", date: "2026-11-20" },
      { id: "sugar", text: "Diabetes ke 7 myths", date: "2026-11-24" },
      { id: "sugar2", text: "Diabetes aur blood sugar", date: "2026-11-25" },
      { id: "fwd", text: "WhatsApp forwards · cancer sach", date: "2026-11-26" },
      { id: "sleep", text: "Sleep myths · neend aur muscle", date: "2026-11-26" },
    ];
    expect(bestVideoFor("High blood pressure (hypertension) guide", c)?.id).toBe("bp");
    expect(bestVideoFor("Type 2 diabetes diet", c)?.id).toBe("sugar2");
    expect(bestVideoFor("Myths about everything", c)).toBeNull();
    expect(bestVideoFor("Migraine", c)).toBeNull();
    // Same playlist ("lifestyle") is not enough on the site: no shared word, no video.
    expect(bestVideoFor("Anaemia and iron", c)).toBeNull();
    // A broad word alone ("muscle") never decides it.
    expect(bestVideoFor("Muscle after 40", c)).toBeNull();
    // On YouTube, "next video" links may be looser.
    expect(bestVideoFor("Anaemia and iron", c, { loose: true })?.id).toBe("fwd");
  });
});

describe("comment and description text", () => {
  it("links the related video, Instagram, the /ig page and the calls number", () => {
    const long = commentText(false, { id: "abc", title: "Diabetes myths" }, LINKS);
    expect(long).toContain(`${DESC_MARKER} "Diabetes myths" https://www.youtube.com/watch?v=abc`);
    expect(long).toContain(LINKS.instagram);
    expect(long).toContain(LINKS.igPage);
    expect(long).toContain("88518 30081");
    expect(long).not.toContain("92668");
    expect(commentText(true, { id: "abc", title: "X" }, LINKS)).toContain("Poori video channel par");
    expect(commentText(true, null, LINKS)).not.toContain("watch?v=");
  });
  it("adds the links after the first paragraph, once", () => {
    const d = descriptionWithLinks("Intro line\nCoach\n\nFree trial: x", { id: "n1", title: "Next" }, { id: "PL1", title: "BP" });
    expect(d).toBe(`Intro line\nCoach\n\n${DESC_MARKER} Next https://www.youtube.com/watch?v=n1\n📃 Playlist: BP https://www.youtube.com/playlist?list=PL1\n\nFree trial: x`);
    expect(descriptionWithLinks(d!, { id: "n1", title: "Next" }, null)).toBeNull();
    expect(descriptionWithLinks("x".repeat(4950), { id: "n1", title: "Next" }, null)).toBeNull();
  });
});

type Call = { url: string; method: string; body?: Record<string, unknown> };
function fakeYoutube(opts: { existingPlaylists?: { id: string; title: string }[]; playlistItems?: Record<string, string[]>; fail?: (c: Call) => { status: number; reason: string } | null } = {}) {
  const calls: Call[] = [];
  let n = 0;
  const f = (async (url: string, init?: RequestInit) => {
    const c: Call = { url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(c);
    const json = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status });
    const bad = opts.fail?.(c);
    if (bad) return json({ error: { message: bad.reason, errors: [{ reason: bad.reason }] } }, bad.status);
    if (url.includes("/playlists?part=snippet&mine=true")) return json({ items: (opts.existingPlaylists ?? []).map((p) => ({ id: p.id, snippet: { title: p.title } })) });
    if (url.includes("/playlists?part=snippet,status")) return json({ id: `PL${++n}` });
    if (url.includes("/playlistItems?part=contentDetails")) {
      const id = new URL(url).searchParams.get("playlistId")!;
      return json({ items: (opts.playlistItems?.[id] ?? []).map((videoId) => ({ contentDetails: { videoId } })) });
    }
    if (url.includes("/playlistItems?part=snippet")) return json({ id: `PI${++n}` });
    if (url.includes("/commentThreads")) return json({ id: `C${++n}` });
    if (url.includes("/videos?part=snippet")) return json({ id: "ok" });
    return json({}, 404);
  }) as typeof fetch;
  return { f, calls };
}

const video = (id: string, title: string, seconds: number, publishedAt: string, extra: Partial<ChannelVideo> = {}): ChannelVideo => ({
  id,
  snippet: { title, description: "Intro\nCoach\n\nFree trial", categoryId: "17", tags: ["noida gym"], defaultLanguage: "en" },
  seconds,
  privacy: "public",
  publishedAt,
  ...extra,
});

function memoryStore(seed: Record<string, string> = {}): Store & { saved: Record<string, string> } {
  const saved: Record<string, string> = {};
  const done = new Map(Object.entries(seed));
  return { done, saved, save: async (k, v) => void ((saved[k] = v), done.set(k, v)) };
}

describe("growChannel", () => {
  const videos = [
    video("L1", "BP aur Heart ke 8 Myths", 280, "2026-11-10T10:00:00Z"),
    video("L2", "Diabetes ke 7 Myths", 270, "2026-11-12T10:00:00Z"),
    video("S1", "Namak se BP badhta hai? Sach", 70, "2026-11-15T10:00:00Z"),
    video("P1", "Private sleep video", 70, "2026-11-16T10:00:00Z", { privacy: "private" }),
  ];

  it("makes playlists, adds videos, comments and links long videos, then remembers all of it", async () => {
    const { f, calls } = fakeYoutube();
    const store = memoryStore();
    const r = await growChannel("tok", videos, store, LINKS, { maxWrites: 100 }, f);
    expect(r.stopped).toBeUndefined();
    expect(r.comments).toBe(3);
    expect(r.descriptions).toBe(2);
    expect(r.playlistsCreated).toBeGreaterThanOrEqual(4); // bp-heart, diabetes, myths, long
    expect(store.saved["comment:P1"]).toBeUndefined(); // private videos are left alone
    const shortComment = calls.find((c) => c.url.includes("commentThreads") && JSON.stringify(c.body).includes('"S1"'))!;
    expect(JSON.stringify(shortComment.body)).toContain("watch?v=L1"); // the BP Short points to the BP long video
    const desc = calls.find((c) => c.method === "PUT" && (c.body as { id: string }).id === "L1")!;
    const sn = (desc.body as { snippet: { description: string; title: string; tags: string[] } }).snippet;
    expect(sn.description).toContain(`${DESC_MARKER} Diabetes ke 7 Myths https://www.youtube.com/watch?v=L2`);
    expect(sn.title).toBe("BP aur Heart ke 8 Myths");
    expect(sn.tags).toEqual(["noida gym"]);
    expect(store.saved["pl:long:L1"]).toBeDefined();
    expect(store.saved["pl:long:S1"]).toBeUndefined();

    // A second run has nothing left to write.
    const again = fakeYoutube();
    const r2 = await growChannel("tok", videos, store, LINKS, { maxWrites: 100 }, again.f);
    expect(r2.writes).toBe(0);
    expect(again.calls.filter((c) => c.method !== "GET")).toEqual([]);
  });

  it("reuses playlists that already exist and doesn't add a video twice", async () => {
    const myths = PLAYLISTS.find((p) => p.key === "myths")!;
    const { f, calls } = fakeYoutube({ existingPlaylists: [{ id: "PLOLD", title: myths.title }], playlistItems: { PLOLD: ["L1"] } });
    const store = memoryStore();
    await growChannel("tok", videos, store, LINKS, { maxWrites: 100 }, f);
    expect(store.saved["playlist:myths"]).toBe("PLOLD");
    expect(store.saved["pl:myths:L1"]).toBe("PLOLD");
    const adds = calls.filter((c) => c.url.includes("playlistItems?part=snippet") && JSON.stringify(c.body).includes("PLOLD"));
    expect(adds.map((c) => JSON.stringify(c.body))).not.toContainEqual(expect.stringContaining('"L1"'));
    expect(calls.filter((c) => c.url.includes("/playlists?part=snippet,status")).map((c) => (c.body as { snippet: { title: string } }).snippet.title)).not.toContain(myths.title);
  });

  it("stays inside the write budget, newest video first", async () => {
    const { f } = fakeYoutube();
    const store = memoryStore();
    const r = await growChannel("tok", videos, store, LINKS, { maxWrites: 5 }, f);
    expect(r.writes).toBe(5);
    expect(r.left).toBeGreaterThan(0);
  });

  it("dry run writes nothing", async () => {
    const { f, calls } = fakeYoutube();
    const r = await growChannel("tok", videos, memoryStore(), LINKS, { dry: true }, f);
    expect(r.writes).toBe(0);
    expect(r.left).toBeGreaterThan(0);
    expect(calls.every((c) => c.method === "GET")).toBe(true);
  });

  it("stops and asks for a reconnect when the token can't write", async () => {
    const { f, calls } = fakeYoutube({ fail: (c) => (c.method === "POST" ? { status: 403, reason: "insufficientPermissions" } : null) });
    const r = await growChannel("tok", videos, memoryStore(), LINKS, { maxWrites: 100 }, f);
    expect(r.stopped).toBe("reconnect");
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });

  it("stops on quota and remembers videos with comments turned off", async () => {
    const q = fakeYoutube({ fail: (c) => (c.url.includes("commentThreads") ? { status: 403, reason: "quotaExceeded" } : null) });
    expect((await growChannel("tok", videos, memoryStore(), LINKS, { maxWrites: 100 }, q.f)).stopped).toBe("quota");
    const off = fakeYoutube({ fail: (c) => (c.url.includes("commentThreads") ? { status: 403, reason: "commentsDisabled" } : null) });
    const store = memoryStore();
    const r = await growChannel("tok", videos, store, LINKS, { maxWrites: 100 }, off.f);
    expect(r.stopped).toBeUndefined();
    expect(store.saved["comment:S1"]).toBe("disabled");
  });
});
