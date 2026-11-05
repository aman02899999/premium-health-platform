// YouTube Shorts automation on a real Postgres (migrations applied), with rendering and YouTube stubbed:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/youtube
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShortDeps } from "./automation";
import type { VideoMeta } from "./client";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.example.in", coach: "Coach Aman Sharma", address: "Gejha Village, Sector 93, Noida" };
// 08:00 IST on 6 Nov 2026.
const now = new Date("2026-11-06T02:30:00Z");

describe.skipIf(!url)("YouTube Shorts on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let yt: typeof import("./automation");
  let bank: typeof import("./shorts-bank");
  const uploads: VideoMeta[] = [];
  let fail: string | null = null;
  let privacy = "public";
  let revoked = false;
  const deps: ShortDeps = {
    render: async (s) => Buffer.from(`mp4:${s.id}`),
    upload: async (_t, _v, meta) => {
      uploads.push(meta);
      return fail ? { ok: false, error: fail, quota: /quota/.test(fail) } : { ok: true, id: `vid${uploads.length}`, privacy, url: `https://youtube.com/shorts/vid${uploads.length}` };
    },
    access: async () => (revoked ? { ok: false, error: "Token has been expired or revoked.", revoked: true } : { ok: true, token: "access-1" }),
  };

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    yt = await import("./automation");
    bank = await import("./shorts-bank");
  });
  afterAll(async () => {
    await pool.query("truncate public.social_posts, public.integration_tokens");
  });
  beforeEach(async () => {
    await pool.query("truncate public.social_posts, public.integration_tokens");
    process.env.YOUTUBE_CLIENT_ID = "cid";
    process.env.YOUTUBE_CLIENT_SECRET = "secret";
    delete process.env.YOUTUBE_SHORTS;
    delete process.env.YOUTUBE_PRIVACY;
    uploads.length = 0;
    fail = null;
    privacy = "public";
    revoked = false;
  });
  const connect = () => pool.query(`insert into public.integration_tokens (name, value) values ('youtube:refresh', 'refresh-1')`);
  const rows = async () => (await pool.query(`select channel, post_date::text as date, theme, status, external_id, permalink, error from public.social_posts order by channel`)).rows;

  it("does nothing until the channel is connected, or when switched off", async () => {
    expect(await yt.runShort(1, now, biz, deps)).toBe("not-connected");
    await connect();
    process.env.YOUTUBE_SHORTS = "off";
    expect(await yt.runShort(1, now, biz, deps)).toBe("off");
    delete process.env.YOUTUBE_CLIENT_ID;
    delete process.env.YOUTUBE_SHORTS;
    expect(await yt.runShort(1, now, biz, deps)).toBe("off");
    expect(uploads).toHaveLength(0);
    expect(await rows()).toEqual([]);
  });

  it("three slots upload three different scripts in bank order, each once, with title, description and tags", async () => {
    await connect();
    for (const s of [1, 2, 3] as const) expect(await yt.runShort(s, now, biz, deps)).toMatch(/^published https:\/\/youtube.com\/shorts\/vid/);
    expect(uploads.map((u) => u.title)).toEqual(bank.SHORTS.slice(0, 3).map((s) => `${s.hook} #shorts`));
    expect(uploads.every((u) => u.privacy === "public" && u.tags.length > 3 && u.description.includes("+91 88518 30081"))).toBe(true);
    const r = await rows();
    expect(r.map((x) => [x.channel, x.date, x.theme, x.status])).toEqual([
      ["youtube-1", "2026-11-06", bank.SHORTS[0].id, "published"],
      ["youtube-2", "2026-11-06", bank.SHORTS[1].id, "published"],
      ["youtube-3", "2026-11-06", bank.SHORTS[2].id, "published"],
    ]);
    // The late retry run finds every slot done and uploads nothing.
    for (const s of [1, 2, 3] as const) expect(await yt.runShort(s, now, biz, deps)).toBe("already-posted");
    expect(uploads).toHaveLength(3);
    // The next day carries on with the next scripts.
    await yt.runShort(1, new Date("2026-11-07T02:30:00Z"), biz, deps);
    expect(uploads.at(-1)!.title).toBe(`${bank.SHORTS[3].hook} #shorts`);
    expect((await yt.youtubeStatus()).left).toBe(bank.SHORTS.length - 4);
  });

  it("a failed upload is recorded and retried later with the same script, never skipping it", async () => {
    await connect();
    fail = "quotaExceeded: The request cannot be completed because you have exceeded your quota.";
    expect(await yt.runShort(1, now, biz, deps)).toMatch(/^failed: quotaExceeded/);
    expect((await rows())[0]).toMatchObject({ status: "failed", theme: bank.SHORTS[0].id, error: expect.stringContaining("quotaExceeded") });
    fail = null;
    expect(await yt.runShort(1, now, biz, deps)).toMatch(/^published/);
    expect(await rows()).toEqual([expect.objectContaining({ channel: "youtube-1", status: "published", theme: bank.SHORTS[0].id, error: null, external_id: "vid2" })]);
  });

  it("flags a Short YouTube kept private (API project not audited yet)", async () => {
    await connect();
    privacy = "private";
    expect(await yt.runShort(2, now, biz, deps)).toMatch(/YouTube kept it private/);
    expect((await rows())[0]).toMatchObject({ status: "published", error: "uploaded as private" });
  });

  it("an expired sign-in fails with a plain fix and uploads nothing", async () => {
    await connect();
    revoked = true;
    expect(await yt.runShort(1, now, biz, deps)).toMatch(/connect the channel again/);
    expect(uploads).toHaveLength(0);
    expect((await rows())[0]).toMatchObject({ status: "failed" });
  });

  it("stops when every script has been used", async () => {
    await connect();
    const values = bank.SHORTS.map((s, i) => `('youtube-${(i % 3) + 1}', date '2026-01-01' + ${Math.floor(i / 3)}, '${s.id}', 'published')`).join(",");
    await pool.query(`insert into public.social_posts (channel, post_date, theme, status) values ${values}`);
    expect(await yt.runShort(1, now, biz, deps)).toBe("bank-empty");
    expect((await yt.youtubeStatus()).left).toBe(0);
  });
});
