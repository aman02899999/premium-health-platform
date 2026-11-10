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

  describe("GitHub runner", () => {
    it("claims the next script, hands over a token and records the upload", async () => {
      await connect();
      const job = await yt.claimRunnerShort(1, now, biz, deps);
      if (typeof job === "string") throw new Error(job);
      expect(job).toMatchObject({ slot: 1, shortId: bank.SHORTS[0].id, index: 0, token: "access-1" });
      expect(job.meta.privacy).toBe("public");
      expect((await rows())[0]).toMatchObject({ channel: "youtube-1", status: "pending", theme: bank.SHORTS[0].id });
      expect(await yt.recordRunnerShort(job.id, { ok: true, id: "vidR", privacy: "public", url: "https://youtube.com/shorts/vidR" })).toBe(true);
      expect((await rows())[0]).toMatchObject({ status: "published", permalink: "https://youtube.com/shorts/vidR" });
      // A published slot is not claimed again, and a closed row can't be overwritten.
      expect(await yt.claimRunnerShort(1, now, biz, deps)).toBe("already-posted");
      expect(await yt.recordRunnerShort(job.id, { ok: false, error: "late", quota: false })).toBe(false);
      expect((await rows())[0]).toMatchObject({ status: "published" });
    });

    it("a failed runner upload frees the slot for the retry with the next script", async () => {
      await connect();
      const first = await yt.claimRunnerShort(2, now, biz, deps);
      if (typeof first === "string") throw new Error(first);
      expect(await yt.recordRunnerShort(first.id, { ok: false, error: "Render/upload: boom", quota: false })).toBe(true);
      expect((await rows())[0]).toMatchObject({ status: "failed", error: "Render/upload: boom" });
      const retry = await yt.claimRunnerShort(2, now, biz, deps);
      expect(typeof retry === "string" ? retry : retry.slot).toBe(2);
    });

    it("an expired sign-in fails the claim and gives the runner nothing", async () => {
      await connect();
      revoked = true;
      expect(await yt.claimRunnerShort(3, now, biz, deps)).toMatch(/connect the channel again/);
      expect((await rows())[0]).toMatchObject({ status: "failed" });
    });

    it("renders on Vercel only when YOUTUBE_RENDERER=vercel", () => {
      expect(yt.shortsRenderedOnVercel({})).toBe(false);
      expect(yt.shortsRenderedOnVercel({ YOUTUBE_RENDERER: "vercel" })).toBe(true);
    });
  });

  describe("long videos", () => {
    const longUploads: VideoMeta[] = [];
    const downloads: string[] = [];
    let thumbFails = false;
    const longDeps: import("./automation").LongDeps = {
      download: async (u) => {
        downloads.push(u);
        return Buffer.from(u);
      },
      upload: async (_t, _v, meta) => {
        longUploads.push(meta);
        return fail ? { ok: false, error: fail, quota: false } : { ok: true, id: `long${longUploads.length}`, privacy: "public", url: `https://youtube.com/shorts/long${longUploads.length}` };
      },
      thumbnail: async () => (thumbFails ? { ok: false, error: "forbidden: channel not verified" } : { ok: true }),
      access: deps.access,
    };
    beforeEach(() => {
      longUploads.length = 0;
      downloads.length = 0;
      thumbFails = false;
    });
    // 13:00 IST on 12 Nov 2026: the first two videos are due.
    const nov12 = new Date("2026-11-12T07:30:00Z");

    it("uploads each due video once, oldest first, at most one a day, with a watch link and the thumbnail", async () => {
      await connect();
      expect(await yt.runLongVideo(nov12, longDeps)).toBe("published https://www.youtube.com/watch?v=long1");
      expect(longUploads[0].title).toMatch(/^10 Fitness Myths/);
      expect(longUploads[0].description).toContain("Chapters\n0:00 Intro");
      expect(downloads).toEqual([expect.stringMatching(/\/youtube\/long\/long-fitness-myths-10\.mp4$/), expect.stringMatching(/\/youtube\/long\/long-fitness-myths-10\.jpg$/)]);
      expect(await yt.runLongVideo(nov12, longDeps)).toBe("already-posted");
      // The next day the second one goes up; the third isn't due until 16 Nov.
      expect(await yt.runLongVideo(new Date("2026-11-13T07:30:00Z"), longDeps)).toMatch(/^published/);
      expect(longUploads[1].title).toMatch(/^8 Desi Diet Myths/);
      expect(await yt.runLongVideo(new Date("2026-11-14T07:30:00Z"), longDeps)).toBe("none-due");
      expect((await rows()).map((r) => [r.channel, r.theme, r.status, r.permalink])).toEqual([
        ["youtube-long", "long-fitness-myths-10", "published", "https://www.youtube.com/watch?v=long1"],
        ["youtube-long", "long-desi-diet-myths-8", "published", "https://www.youtube.com/watch?v=long2"],
      ]);
      // Long videos never count against the Shorts bank.
      expect((await yt.youtubeStatus()).left).toBe(bank.SHORTS.length);
    });

    it("waits for its date, retries a failed upload, and reports a thumbnail it couldn't set", async () => {
      await connect();
      expect(await yt.runLongVideo(new Date("2026-11-08T07:30:00Z"), longDeps)).toBe("none-due");
      fail = "uploadLimitExceeded: too many";
      expect(await yt.runLongVideo(nov12, longDeps)).toMatch(/^failed: uploadLimitExceeded/);
      fail = null;
      thumbFails = true;
      expect(await yt.runLongVideo(nov12, longDeps)).toMatch(/^published .*thumbnail not set: forbidden/);
      expect(longUploads.map((u) => u.title.slice(0, 15))).toEqual(["10 Fitness Myth", "10 Fitness Myth"]);
      expect(await rows()).toEqual([expect.objectContaining({ channel: "youtube-long", status: "published", error: null })]);
    });

    it("does nothing when switched off or not connected", async () => {
      expect(await yt.runLongVideo(nov12, longDeps)).toBe("not-connected");
      await connect();
      process.env.YOUTUBE_SHORTS = "off";
      expect(await yt.runLongVideo(nov12, longDeps)).toBe("off");
      expect(longUploads).toHaveLength(0);
    });
  });
});
