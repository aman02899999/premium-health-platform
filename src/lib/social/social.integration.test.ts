// Social automation on a real Postgres (migrations applied), with Meta's APIs stubbed:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/social/social.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("social automation on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let social: typeof import("./automation");
  const calls: { url: string; body: Record<string, unknown> | null; auth?: string }[] = [];
  let publishFails = false;
  let reelFails = false;

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "wa-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    process.env.INSTAGRAM_ACCESS_TOKEN = "ig-seed-token";
    process.env.FACEBOOK_PAGE_ID = "PAGE1";
    process.env.FACEBOOK_PAGE_TOKEN = "fb-page-token";
    delete process.env.SOCIAL_AUTO_REPLY;
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string; headers?: Record<string, string> }) => {
      calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : null, auth: init?.headers?.authorization });
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
      if (u.includes("/refresh_access_token")) return json({ access_token: "ig-fresh-token", expires_in: 5184000 });
      if (u.includes("/me?fields=user_id")) return json({ user_id: "17841400000", username: "royalfitness93_" });
      if (u.endsWith("/17841400000/media")) {
        if (publishFails) return json({ error: { message: "Only photo or video can be accepted as media type." } }, 400);
        const isReel = (JSON.parse(init?.body ?? "{}") as { media_type?: string }).media_type === "REELS";
        return isReel && reelFails ? json({ error: { message: "The video file you selected is in a format that we don't support." } }, 400) : json({ id: "container-1" });
      }
      if (u.includes("container-1?fields=status_code")) return json({ status_code: "FINISHED" });
      if (u.endsWith("/media_publish")) return json({ id: "media-9" });
      if (u.includes("media-9?fields=permalink")) return json({ permalink: "https://www.instagram.com/p/abc/" });
      if (u.endsWith("/17841400000/messages")) return json({ recipient_id: "555", message_id: "mid.out" });
      if (u.endsWith("/123/messages")) return json({ messages: [{ id: "wamid.out" }] });
      if (u.endsWith("/PAGE1?fields=access_token")) return json({ access_token: "page-own-token", id: "PAGE1" });
      if (u.endsWith("/PAGE1/messages")) return json({ recipient_id: "u2", message_id: "fbmid.out" });
      if (u.endsWith("/PAGE1/photos")) return json({ id: "photo1", post_id: "PAGE1_post9" });
      if (u.endsWith("/PAGE1/video_reels")) {
        if (reelFails) return json({ error: { message: "(#100) Reels upload not allowed" } }, 400);
        const phase = (JSON.parse(init?.body ?? "{}") as { upload_phase?: string }).upload_phase;
        return phase === "start" ? json({ video_id: "v77", upload_url: "https://rupload.facebook.test/video-upload/v21.0/v77" }) : json({ success: true });
      }
      if (u === "https://rupload.facebook.test/video-upload/v21.0/v77") return json({ success: true });
      return json({ error: { message: `unexpected ${u}` } }, 404);
    });
    pool = (await import("@/health/db")).pool;
    social = await import("./automation");
  });
  beforeEach(async () => {
    await pool.query("truncate public.social_inbox, public.social_posts, public.integration_tokens, public.leads, public.members, public.message_outbox, public.chat_replies cascade");
    calls.length = 0;
    publishFails = false;
    reelFails = false;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const wa = (id: string, text: string, from = "919876543210", fromName = "Rahul Kumar") => ({ id: `wa:${id}`, channel: "whatsapp" as const, kind: "message" as const, from, fromName, text });

  it("a WhatsApp 'Hi' becomes a lead and gets the menu once; a keyword later still gets its answer", async () => {
    expect(await social.handleInbound(wa("1", "Hi"))).toBe("replied");
    expect(await social.handleInbound(wa("1", "Hi"))).toBe("duplicate"); // Meta retried the webhook
    expect(await social.handleInbound(wa("2", "hello?"))).toBe("logged"); // a coach may be chatting by now
    expect(await social.handleInbound(wa("3", "fees kitni hai"))).toBe("replied");

    const out = calls.filter((c) => c.url.endsWith("/123/messages")).map((c) => c.body!.interactive as { type: string; body: { text: string } });
    expect(out.map((o) => o.type)).toEqual(["list", "button"]); // the menu, then fees with buttons
    expect(out[0].body.text).toContain("Hi Rahul! 👋 Welcome to *Royal Fitness Club*, Noida.");
    expect(out[1].body.text).toContain("*Gym Membership* 💪");

    const leads = (await pool.query("select name, phone, source, interest, follow_ups from public.leads")).rows;
    expect(leads).toEqual([{ name: "Rahul Kumar", phone: "9876543210", source: "whatsapp-inbound", interest: "", follow_ups: false }]);
    const inbox = (await pool.query("select id, intent, replied, lead_id is not null as has_lead from public.social_inbox order by id")).rows;
    expect(inbox).toEqual([
      { id: "wa:1", intent: "hello", replied: true, has_lead: true },
      { id: "wa:2", intent: "hello", replied: false, has_lead: true },
      { id: "wa:3", intent: "price", replied: true, has_lead: true },
    ]);
  });

  it("a reply to a campaign offer gets the fees once and becomes a membership lead; a 'no' is left to the coach", async () => {
    const offer = (to: string) =>
      pool.query(
        `insert into public.message_outbox (channel, to_address, kind, body, template, dedupe_key, status, sent_at) values ('whatsapp', $1, 'offer-broadcast', 'offer', 'rfc_offer_broadcast_v1', $2, 'sent', now() - interval '1 hour')`,
        [to, `campaign:test:${to}`],
      );
    await offer("919876543210");
    await offer("919811112222");

    expect(await social.handleInbound(wa("30", "Interested"))).toBe("replied");
    expect(await social.handleInbound(wa("31", "ok"))).toBe("logged"); // we've answered since the offer: back to the usual rules
    expect(await social.handleInbound(wa("32", "nahi chahiye", "919811112222", "Neha"))).toBe("logged");

    const out = calls.filter((c) => c.url.endsWith("/123/messages"));
    expect(out).toHaveLength(1);
    expect((out[0].body!.interactive as { body: { text: string } }).body.text).toContain("*Gym Membership* 💪");
    const leads = (await pool.query("select phone, source, interest, follow_ups from public.leads order by phone")).rows;
    expect(leads).toEqual([{ phone: "9876543210", source: "whatsapp-campaign", interest: "membership", follow_ups: false }]);
  });

  it("a chat opened from a printed QR is answered and credited to that QR; START PROMOTIONS records consent", async () => {
    await pool.query("truncate public.qr_codes, public.qr_scans, public.marketing_contacts, public.whatsapp_optouts cascade");
    await pool.query(`insert into public.qr_codes (code, label, kind, target) values ('TestQr12', 'Reception', 'bot', 'https://wa.me/919266840289')`);
    expect(await social.handleInbound(wa("40", "Hi! I saw your QR code. Please share the membership offer. (ref TestQr12)"))).toBe("replied");
    expect(await social.handleInbound(wa("41", "Hi (ref NotACode)", "919811113333", "Amit"))).toBe("replied");
    const leads = (await pool.query("select phone, source from public.leads order by phone")).rows;
    expect(leads).toEqual([
      { phone: "9811113333", source: "whatsapp-inbound" },
      { phone: "9876543210", source: "qr:TestQr12" },
    ]);
    expect(await social.handleInbound(wa("42", "START PROMOTIONS", "919822224444", "Sonia"))).toBe("replied");
    const consent = (await pool.query("select channel, address, name, source, unsubscribed_at is null as active from public.marketing_contacts")).rows;
    expect(consent).toEqual([{ channel: "whatsapp", address: "919822224444", name: "Sonia", source: "whatsapp: start promotions", active: true }]);
  });

  it("a chat from a Click-to-WhatsApp ad is credited to the ad campaign", async () => {
    await pool.query("truncate public.ad_campaigns cascade");
    await pool.query(`insert into public.ad_campaigns (name, platform, slug, start_on) values ('Diwali offer', 'meta', 'diwali-offer', current_date)`);
    expect(await social.handleInbound(wa("50", "Hi! I saw your ad. Please share the membership offer. (ad diwali-offer)"))).toBe("replied");
    expect((await pool.query("select source from public.leads")).rows).toEqual([{ source: "ad:diwali-offer" }]);
  });

  it("an existing member who messages is not added as a lead, and a foreign number never is", async () => {
    await pool.query(
      `insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Asha Rao', '9123456780', 'Monthly', current_date, current_date + 30, 'RFC-ASHA-2345')`,
    );
    await social.handleInbound(wa("10", "timing?", "919123456780", "Asha"));
    await social.handleInbound(wa("11", "price", "14155550123", "Tom"));
    expect((await pool.query("select count(*)::int as n from public.leads")).rows[0].n).toBe(0);
    expect(calls.filter((c) => c.url.endsWith("/123/messages"))).toHaveLength(2);
  });

  it("an Instagram 'PRICE' comment gets a private reply without asterisks; an ordinary comment gets none", async () => {
    await social.handleInbound({ id: "igc:c1", channel: "instagram", kind: "comment", from: "777", fromName: "fit_priya", text: "PRICE" });
    await social.handleInbound({ id: "igc:c2", channel: "instagram", kind: "comment", from: "778", fromName: "someone", text: "nice physique 🔥" });
    const dms = calls.filter((c) => c.url.endsWith("/17841400000/messages"));
    expect(dms).toHaveLength(1);
    expect(dms[0].body!.recipient).toEqual({ comment_id: "c1" });
    const text = (dms[0].body!.message as { text: string }).text;
    expect(text).toContain("Royal Fitness Club: membership fees");
    expect(text).not.toContain("*");
  });

  it("Facebook: a 'PRICE' comment gets a private reply; the day's post goes on the Page once", async () => {
    await social.handleInbound({ id: "fbc:c9", channel: "facebook", kind: "comment", from: "u2", fromName: "Ravi K", text: "PRICE" });
    const fb = calls.filter((c) => c.url.endsWith("/PAGE1/messages"));
    expect(fb).toHaveLength(1);
    expect(fb[0].body!.recipient).toEqual({ comment_id: "c9" });
    // The System User token is swapped for the Page's own token, which Meta requires to act as the Page.
    expect(fb[0].auth).toBe("Bearer page-own-token");
  });

  it("publishes the day's sales Story once, as a STORIES media with the story image", async () => {
    const now = new Date("2026-10-16T02:15:00Z");
    expect((await social.runInstagramStory(now)).story).toBe("published");
    expect((await social.runInstagramStory(now)).story).toBe("already-posted");
    const media = calls.filter((c) => c.url.endsWith("/17841400000/media"));
    expect(media).toHaveLength(1);
    expect(media[0].body).toEqual({ image_url: expect.stringMatching(/\/api\/social\/story-image\/2026-10-16\.jpg$/), media_type: "STORIES" });
    const rows = (await pool.query("select channel, status from public.social_posts")).rows;
    expect(rows).toEqual([{ channel: "instagram-story", status: "published" }]);
  });

  it("SOCIAL_AUTO_REPLY=off logs messages without answering", async () => {
    process.env.SOCIAL_AUTO_REPLY = "off";
    expect(await social.handleInbound(wa("20", "price"))).toBe("logged");
    delete process.env.SOCIAL_AUTO_REPLY;
    expect(calls.filter((c) => c.url.endsWith("/123/messages"))).toHaveLength(0);
  });

  const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.royalfitnesclub.in", coach: "Coach Aman Sharma", membershipFrom: 2000 };
  const VIDEO = "https://store.test/storage/v1/object/public/social-media/reels/2026-10-12.mp4";
  const fakeDeps = (log: string[], renderFails = false) => ({
    render: async (date: string) => {
      log.push(`render ${date}`);
      if (renderFails) throw new Error("ffmpeg exited 1: out of memory");
      return Buffer.from("mp4");
    },
    upload: async (path: string, _d: Buffer, type: string) => (log.push(`upload ${path} ${type}`), `https://store.test/storage/v1/object/public/social-media/${path}`),
    remove: async (path: string) => void log.push(`remove ${path}`),
  });

  it("the evening Reel: rendered once, published as a Reel on Instagram and Facebook, once a day", async () => {
    const now = new Date("2026-10-12T13:20:00Z"); // 6:50 pm in India
    const log: string[] = [];
    expect(await social.runReels(now, biz, fakeDeps(log))).toEqual({ reel: "rendered", instagram: "reel", facebook: "reel" });
    expect(log).toEqual(["render 2026-10-12", "upload reels/2026-10-12.mp4 video/mp4", "remove reels/2026-09-12.mp4"]);

    const media = calls.filter((c) => c.url.endsWith("/17841400000/media"));
    expect(media).toHaveLength(1);
    expect(media[0].body).toMatchObject({ media_type: "REELS", video_url: VIDEO, share_to_feed: "true" });
    expect(String(media[0].body!.caption)).toContain("#RoyalFitnessClub");
    const reels = calls.filter((c) => c.url.endsWith("/PAGE1/video_reels"));
    expect(reels.map((c) => c.body!.upload_phase)).toEqual(["start", "finish"]);
    expect(reels[1].body).toMatchObject({ video_id: "v77", video_state: "PUBLISHED" });
    expect(String(reels[1].body!.description)).toContain("utm_source=facebook");
    expect(reels[0].auth).toBe("Bearer page-own-token");
    expect(calls.find((c) => c.url.startsWith("https://rupload.facebook.test/"))!.auth).toBe("OAuth page-own-token");
    expect(calls.filter((c) => c.url.endsWith("/PAGE1/photos"))).toHaveLength(0);

    const posts = (await pool.query("select channel, status, external_id, permalink from public.social_posts order by channel")).rows;
    expect(posts).toEqual([
      { channel: "facebook", status: "published", external_id: "v77", permalink: "https://www.facebook.com/reel/v77" },
      { channel: "instagram", status: "published", external_id: "media-9", permalink: "https://www.instagram.com/p/abc/" },
    ]);
    // The retry run later that evening finds nothing to do and renders nothing.
    const again: string[] = [];
    expect(await social.runReels(new Date("2026-10-12T15:40:00Z"), biz, fakeDeps(again))).toEqual({ reel: "already-posted", instagram: "already-posted", facebook: "already-posted" });
    expect(again).toEqual([]);
  });

  it("a Reel that can't be published falls back to the day's photo, so the feed never misses a day", async () => {
    reelFails = true;
    const out = await social.runReels(new Date("2026-10-12T13:20:00Z"), biz, fakeDeps([]));
    expect(out.reel).toBe("rendered");
    expect(out.instagram).toMatch(/^photo \(reel failed: The video file/);
    expect(out.facebook).toMatch(/^photo \(reel failed: \(#100\)/);
    const igMedia = calls.filter((c) => c.url.endsWith("/17841400000/media")).map((c) => c.body);
    expect(igMedia[1]).toMatchObject({ image_url: "https://www.royalfitnesclub.in/api/social/post-image/2026-10-12.jpg" });
    expect(calls.find((c) => c.url.endsWith("/PAGE1/photos"))!.body).toMatchObject({ url: "https://www.royalfitnesclub.in/api/social/post-image/2026-10-12.jpg" });
    const rows = (await pool.query("select channel, status from public.social_posts order by channel")).rows;
    expect(rows).toEqual([
      { channel: "facebook", status: "published" },
      { channel: "instagram", status: "published" },
    ]);
  });

  it("a video that fails to render still posts the photo; a failed day is retried by the next run", async () => {
    const log: string[] = [];
    publishFails = true; // Instagram rejects even the photo this time
    const first = await social.runReels(new Date("2026-10-12T13:20:00Z"), biz, fakeDeps(log, true));
    expect(first.reel).toBe("failed: ffmpeg exited 1: out of memory");
    expect(first.instagram).toMatch(/^failed: Only photo/);
    expect(first.facebook).toBe("photo");
    publishFails = false;
    const retry = await social.runReels(new Date("2026-10-12T15:40:00Z"), biz, fakeDeps(log));
    expect(retry).toEqual({ reel: "rendered", instagram: "reel", facebook: "already-posted" });
    const rows = (await pool.query("select channel, status from public.social_posts order by channel")).rows;
    expect(rows).toEqual([
      { channel: "facebook", status: "published" },
      { channel: "instagram", status: "published" },
    ]);
  });

  it("a run that died half way is taken over after 20 minutes, not before", async () => {
    await pool.query(`insert into public.social_posts (channel, post_date, theme, status, created_at) values ('instagram', '2026-10-12', 't', 'pending', now() - interval '5 minutes')`);
    process.env.FACEBOOK_PAGE_ID = "";
    try {
      expect((await social.runReels(new Date("2026-10-12T13:20:00Z"), biz, fakeDeps([]))).instagram).toBe("already-posted");
      await pool.query(`update public.social_posts set created_at = now() - interval '25 minutes'`);
      expect((await social.runReels(new Date("2026-10-12T13:20:00Z"), biz, fakeDeps([]))).instagram).toBe("reel");
    } finally {
      process.env.FACEBOOK_PAGE_ID = "PAGE1";
    }
  });

  it("month plan: the morning card posts once per channel inside the plan, and nothing outside it", async () => {
    const before = await social.runMonthPost("am", new Date("2026-10-31T02:30:00Z"), biz);
    expect(before).toEqual({ instagram: "not-scheduled", facebook: "not-scheduled" });
    expect(calls).toHaveLength(0);

    const now = new Date("2026-11-01T02:30:00Z"); // 8 am in India, day 1
    expect(await social.runMonthPost("am", now, biz)).toEqual({ instagram: "published", facebook: "published" });
    const igMedia = calls.filter((c) => c.url.endsWith("/17841400000/media"));
    expect(igMedia).toHaveLength(1);
    expect(igMedia[0].body).toMatchObject({ image_url: "https://www.royalfitnesclub.in/api/social/card/2026-11-01-am.jpg" });
    expect(String(igMedia[0].body!.caption)).toContain("link in bio");
    const fbPhoto = calls.find((c) => c.url.endsWith("/PAGE1/photos"))!;
    expect(fbPhoto.body).toMatchObject({ url: "https://www.royalfitnesclub.in/api/social/card/2026-11-01-am.jpg" });
    expect(String(fbPhoto.body!.caption ?? fbPhoto.body!.message)).toContain("utm_campaign=month-plan");

    // The evening retry run finds it done; the afternoon card is its own slot.
    expect(await social.runMonthPost("am", new Date("2026-11-01T16:10:00Z"), biz)).toEqual({ instagram: "already-posted", facebook: "already-posted" });
    expect(await social.runMonthPost("pm", new Date("2026-11-01T10:30:00Z"), biz)).toEqual({ instagram: "published", facebook: "published" });
    const rows = (await pool.query("select channel, status from public.social_posts order by channel")).rows;
    expect(rows).toEqual([
      { channel: "facebook-am", status: "published" },
      { channel: "facebook-pm", status: "published" },
      { channel: "instagram-am", status: "published" },
      { channel: "instagram-pm", status: "published" },
    ]);
  });

  it("month plan: SOCIAL_MONTH_PLAN=off stops every extra post", async () => {
    process.env.SOCIAL_MONTH_PLAN = "off";
    try {
      expect(await social.runMonthPost("am", new Date("2026-11-01T02:30:00Z"), biz)).toEqual({ instagram: "not-scheduled", facebook: "not-scheduled" });
      expect((await social.runSecondReel(new Date("2026-11-01T06:30:00Z"), biz, fakeDeps2([]))).reel).toBe("not-scheduled");
      expect(calls).toHaveLength(0);
    } finally {
      delete process.env.SOCIAL_MONTH_PLAN;
    }
  });

  const fakeDeps2 = (log: string[], renderFails = false) => ({
    render: async (post: { date: string; title: string }, seed: number, photo: string | null) => {
      log.push(`render ${post.date} ${photo}`);
      if (renderFails) throw new Error("ffmpeg exited 1: out of memory");
      return Buffer.from("mp4");
    },
    upload: async (path: string, _d: Buffer, type: string) => (log.push(`upload ${path} ${type}`), `https://store.test/storage/v1/object/public/social-media/${path}`),
    remove: async (path: string) => void log.push(`remove ${path}`),
  });

  it("month plan: the second Reel renders with a gallery photo, posts once, and a failed render is retried", async () => {
    const log: string[] = [];
    const failed = await social.runSecondReel(new Date("2026-11-01T06:30:00Z"), biz, fakeDeps2(log, true));
    expect(failed.reel).toBe("failed: ffmpeg exited 1: out of memory");
    expect(failed.instagram).toMatch(/^failed: No video/);
    expect(calls.filter((c) => c.url.endsWith("/17841400000/media"))).toHaveLength(0);

    const retry = await social.runSecondReel(new Date("2026-11-01T16:10:00Z"), biz, fakeDeps2(log));
    expect(retry).toEqual({ reel: "rendered", instagram: "published", facebook: "published" });
    expect(log.at(-3)).toMatch(/^render 2026-11-01 aman-sharma-[a-z-]+\.webp$/);
    expect(log.slice(-2)).toEqual(["upload reels/2026-11-01-2.mp4 video/mp4", "remove reels/2026-10-02-2.mp4"]);
    const media = calls.filter((c) => c.url.endsWith("/17841400000/media"));
    expect(media[0].body).toMatchObject({ media_type: "REELS", video_url: "https://store.test/storage/v1/object/public/social-media/reels/2026-11-01-2.mp4" });

    expect((await social.runSecondReel(new Date("2026-11-01T16:30:00Z"), biz, fakeDeps2([]))).reel).toBe("already-posted");
    const rows = (await pool.query("select channel, status from public.social_posts order by channel")).rows;
    expect(rows).toEqual([
      { channel: "facebook-reel2", status: "published" },
      { channel: "instagram-reel2", status: "published" },
    ]);
  });

  it("the morning Story keeps the Instagram token fresh", async () => {
    const out = await social.runInstagramStory(new Date("2026-10-12T02:15:00Z"));
    expect(out).toEqual({ story: "published", token: "refreshed" });
    expect(calls.filter((c) => c.url.includes("/refresh_access_token"))).toHaveLength(1);
    expect((await pool.query("select value from public.integration_tokens")).rows).toEqual([{ value: "ig-fresh-token" }]);
  });
});
