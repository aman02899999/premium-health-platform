import { beforeEach, describe, expect, it, vi } from "vitest";

const customer = vi.fn();
const store = {
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  startAttempt: vi.fn(),
  submit: vi.fn(),
  reveal: vi.fn(),
  history: vi.fn(async () => []),
  attemptsOf: vi.fn(async () => []),
  liveQuestions: vi.fn(async () => []),
  current: vi.fn(async () => null),
  leaderboard: vi.fn(async () => ({ rows: [], yourRank: 3, players: 10 })),
  decideReferral: vi.fn(async () => null),
  referralStats: vi.fn(async () => null),
  lastStarts: vi.fn(async () => ({})),
  shareTask: vi.fn(async (): Promise<unknown> => null),
  prizesOf: vi.fn(async () => []),
};
const toSalesFunnel = vi.fn(async () => true);
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => fn() }));
vi.mock("@/health/db", () => ({ isDbConfigured: true, pool: {} }));
vi.mock("@/lib/shop/server", () => ({ currentCustomer: () => customer() }));
vi.mock("@/lib/challenge/store", () => store);
vi.mock("@/lib/challenge/automation", () => ({ toSalesFunnel }));
vi.mock("@/lib/social/site-feed", () => ({ siteFeed: async () => ({ long: [{ youtubeId: "abcDEF12345" }] }) }));

const { GET, POST } = await import("./route");
const req = (body: unknown, origin?: string) => new Request("http://localhost/api/challenge", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...(origin ? { origin } : {}) } });
const me = { id: "u1", email: "u@x.in", name: "U" };

describe("challenge API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customer.mockResolvedValue(me);
  });

  it("needs sign-in", async () => {
    customer.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(req({ action: "start", level: "beginner" }))).status).toBe(401);
  });

  it("refuses cross-site posts", async () => {
    expect((await POST(req({ action: "start", level: "beginner" }, "https://evil.example"))).status).toBe(403);
  });

  it("validates the profile and keeps both consents off unless ticked", async () => {
    expect((await POST(req({ action: "profile", firstName: "Rahul", phone: "12345", area: "ncr" }))).status).toBe(400);
    expect((await POST(req({ action: "profile", firstName: "Rahul", phone: "98765 43210", area: "mars" }))).status).toBe(400);
    const ok = await POST(req({ action: "profile", firstName: "Rahul", lastInitial: "K", phone: "+91 98765 43210", area: "ncr" }));
    expect(ok.status).toBe(200);
    expect(store.saveProfile).toHaveBeenCalledWith("u1", "u@x.in", { firstName: "Rahul", lastInitial: "K", phone: "9876543210", area: "ncr", leaderboard: false, contactConsent: false }, undefined);
  });

  it("passes a referral code through and refuses a phone already used by another account", async () => {
    store.saveProfile.mockResolvedValue("phone-taken");
    const res = await POST(req({ action: "profile", firstName: "Asha", phone: "9876543210", area: "outside", ref: "rahul4k7q" }));
    expect(res.status).toBe(409);
    expect(store.saveProfile).toHaveBeenLastCalledWith("u1", "u@x.in", expect.any(Object), "RAHUL4K7Q");
  });

  it("needs a profile before starting and maps start errors", async () => {
    store.getProfile.mockResolvedValue(null);
    expect((await POST(req({ action: "start", level: "advance" }))).status).toBe(400);
    store.getProfile.mockResolvedValue({ firstName: "R" });
    store.startAttempt.mockResolvedValue({ ok: false, error: "locked" });
    expect((await POST(req({ action: "start", level: "advance" }))).status).toBe(403);
    store.startAttempt.mockResolvedValue({ ok: false, error: "wait", nextFreeAt: 123 });
    const wait = await POST(req({ action: "start", level: "beginner" }));
    expect(wait.status).toBe(409);
    expect((await wait.json()).nextFreeAt).toBe(123);
  });

  it("starts the watch-and-share task with the newest video", async () => {
    store.getProfile.mockResolvedValue({ firstName: "R" });
    store.shareTask.mockResolvedValue({ code: "SABCDEFGH", videoId: "abcDEF12345", visits: 0, rewarded: false });
    const res = await POST(req({ action: "share" }));
    expect(res.status).toBe(200);
    expect(store.shareTask).toHaveBeenCalledWith("u1", "abcDEF12345", "unknown");
  });

  it("rejects a bad index", async () => {
    expect((await POST(req({ action: "answer", index: 99, choice: 0 }))).status).toBe(400);
  });

  it("returns the result and hands the player to the sales funnel when the last answer lands", async () => {
    const finished = { attemptId: "a", level: "beginner", month: "2026-12", correct: 17, totalMs: 1, certificateCode: "RFC-0000ABCD", firstOfMonth: true };
    store.submit.mockResolvedValue({ view: { finished: true }, finished });
    const res = await POST(req({ action: "answer", index: 19, choice: 1 }));
    const j = await res.json();
    expect(j.result).toMatchObject({ correct: 17, pct: 85, tier: "silver", rank: 3, certificateCode: "RFC-0000ABCD" });
    expect(toSalesFunnel).toHaveBeenCalledWith("u1", finished);
    expect(store.decideReferral).toHaveBeenCalledWith("u1");
    expect(JSON.stringify(j)).not.toMatch(/"answer"/);
  });
});
