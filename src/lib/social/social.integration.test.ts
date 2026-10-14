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
  const calls: { url: string; body: Record<string, unknown> | null }[] = [];
  let publishFails = false;

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "wa-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    process.env.INSTAGRAM_ACCESS_TOKEN = "ig-seed-token";
    process.env.FACEBOOK_PAGE_ID = "PAGE1";
    process.env.FACEBOOK_PAGE_TOKEN = "fb-page-token";
    delete process.env.SOCIAL_AUTO_REPLY;
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      calls.push({ url: u, body: init?.body ? JSON.parse(init.body) : null });
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
      if (u.includes("/refresh_access_token")) return json({ access_token: "ig-fresh-token", expires_in: 5184000 });
      if (u.includes("/me?fields=user_id")) return json({ user_id: "17841400000", username: "royalfitness93_" });
      if (u.endsWith("/17841400000/media")) return publishFails ? json({ error: { message: "Only photo or video can be accepted as media type." } }, 400) : json({ id: "container-1" });
      if (u.includes("container-1?fields=status_code")) return json({ status_code: "FINISHED" });
      if (u.endsWith("/media_publish")) return json({ id: "media-9" });
      if (u.includes("media-9?fields=permalink")) return json({ permalink: "https://www.instagram.com/p/abc/" });
      if (u.endsWith("/17841400000/messages")) return json({ recipient_id: "555", message_id: "mid.out" });
      if (u.endsWith("/123/messages")) return json({ messages: [{ id: "wamid.out" }] });
      if (u.endsWith("/PAGE1/messages")) return json({ recipient_id: "u2", message_id: "fbmid.out" });
      if (u.endsWith("/PAGE1/photos")) return json({ id: "photo1", post_id: "PAGE1_post9" });
      return json({ error: { message: `unexpected ${u}` } }, 404);
    });
    pool = (await import("@/health/db")).pool;
    social = await import("./automation");
  });
  beforeEach(async () => {
    await pool.query("truncate public.social_inbox, public.social_posts, public.integration_tokens, public.leads, public.members cascade");
    calls.length = 0;
    publishFails = false;
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

    const sent = calls.filter((c) => c.url.endsWith("/123/messages")).map((c) => (c.body!.text as { body: string }).body);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toContain("Hi Rahul! Thanks for messaging Royal Fitness Club.");
    expect(sent[1]).toContain("*Royal Fitness Club: membership fees*");

    const leads = (await pool.query("select name, phone, source, interest, follow_ups from public.leads")).rows;
    expect(leads).toEqual([{ name: "Rahul Kumar", phone: "9876543210", source: "whatsapp-inbound", interest: "", follow_ups: false }]);
    const inbox = (await pool.query("select id, intent, replied, lead_id is not null as has_lead from public.social_inbox order by id")).rows;
    expect(inbox).toEqual([
      { id: "wa:1", intent: "hello", replied: true, has_lead: true },
      { id: "wa:2", intent: "hello", replied: false, has_lead: true },
      { id: "wa:3", intent: "price", replied: true, has_lead: true },
    ]);
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
    const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.royalfitnesclub.in", coach: "Coach Aman Sharma" };
    const now = new Date("2026-10-12T02:15:00Z");
    expect(await social.runFacebook(now, biz)).toEqual({ facebook: "published" });
    expect(await social.runFacebook(now, biz)).toEqual({ facebook: "already-posted" });
    const photo = calls.find((c) => c.url.endsWith("/PAGE1/photos"))!;
    expect(photo.body).toMatchObject({ url: "https://www.royalfitnesclub.in/api/social/post-image/2026-10-12.jpg" });
    expect(String(photo.body!.message)).toContain("utm_source=facebook");
  });

  it("SOCIAL_AUTO_REPLY=off logs messages without answering", async () => {
    process.env.SOCIAL_AUTO_REPLY = "off";
    expect(await social.handleInbound(wa("20", "price"))).toBe("logged");
    delete process.env.SOCIAL_AUTO_REPLY;
    expect(calls.filter((c) => c.url.endsWith("/123/messages"))).toHaveLength(0);
  });

  it("posts the day's image to Instagram once, refreshes the token, and retries a failed day", async () => {
    const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.royalfitnesclub.in", coach: "Coach Aman Sharma", membershipFrom: 2000 };
    const now = new Date("2026-10-12T02:15:00Z");

    publishFails = true;
    expect((await social.runInstagram(now, biz)).instagram).toMatch(/^failed: Only photo/);
    publishFails = false;
    const ok = await social.runInstagram(now, biz);
    expect(ok).toEqual({ instagram: "published", token: "fresh" });
    expect((await social.runInstagram(now, biz)).instagram).toBe("already-posted");

    const media = calls.filter((c) => c.url.endsWith("/17841400000/media"));
    expect(media[1].body).toMatchObject({ image_url: "https://www.royalfitnesclub.in/api/social/post-image/2026-10-12.jpg" });
    expect(String(media[1].body!.caption)).toContain("#RoyalFitnessClub");
    expect(calls.filter((c) => c.url.endsWith("/media_publish"))).toHaveLength(1);
    // First run refreshed the seed token and stored it; later calls use the stored one.
    expect(calls.filter((c) => c.url.includes("/refresh_access_token"))).toHaveLength(1);
    expect((await pool.query("select value from public.integration_tokens")).rows).toEqual([{ value: "ig-fresh-token" }]);
    const posts = (await pool.query("select post_date::text as d, status, external_id, permalink from public.social_posts")).rows;
    expect(posts).toEqual([{ d: "2026-10-12", status: "published", external_id: "media-9", permalink: "https://www.instagram.com/p/abc/" }]);
  });
});
