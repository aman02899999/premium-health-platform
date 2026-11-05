import { beforeEach, describe, expect, it } from "vitest";
import { accessToken, authUrl, exchangeCode, uploadVideo, youtubePrivacy, youtubeShortsOn } from "./client";

type Call = { url: string; init?: RequestInit };
function fake(replies: ((c: Call) => Response)[]) {
  const calls: Call[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    const c = { url: String(url), init };
    calls.push(c);
    return replies[calls.length - 1](c);
  }) as unknown as typeof fetch;
  return { f, calls };
}
const json = (b: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", ...headers } });

beforeEach(() => {
  process.env.YOUTUBE_CLIENT_ID = "cid";
  process.env.YOUTUBE_CLIENT_SECRET = "secret";
  delete process.env.YOUTUBE_SHORTS;
  delete process.env.YOUTUBE_PRIVACY;
});

describe("switches", () => {
  it("is on only with both credentials and without YOUTUBE_SHORTS=off; privacy defaults to public", () => {
    expect(youtubeShortsOn()).toBe(true);
    process.env.YOUTUBE_SHORTS = "off";
    expect(youtubeShortsOn()).toBe(false);
    delete process.env.YOUTUBE_SHORTS;
    delete process.env.YOUTUBE_CLIENT_SECRET;
    expect(youtubeShortsOn()).toBe(false);
    expect(youtubePrivacy()).toBe("public");
    process.env.YOUTUBE_PRIVACY = "unlisted";
    expect(youtubePrivacy()).toBe("unlisted");
    process.env.YOUTUBE_PRIVACY = "nonsense";
    expect(youtubePrivacy()).toBe("public");
  });
});

describe("sign-in", () => {
  it("asks only for upload and read-only access, offline, with consent so a refresh token comes back", () => {
    const u = new URL(authUrl("https://www.example.in/", "st4te"));
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(u.searchParams.get("redirect_uri")).toBe("https://www.example.in/api/admin/youtube/callback");
    expect(u.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly");
    expect(u.searchParams.get("access_type")).toBe("offline");
    expect(u.searchParams.get("prompt")).toBe("consent");
    expect(u.searchParams.get("state")).toBe("st4te");
  });

  it("exchanges the code and refuses a reply with no refresh token", async () => {
    const ok = fake([() => json({ access_token: "a", refresh_token: "r", expires_in: 3599 })]);
    expect(await exchangeCode("c0de", "https://www.example.in", ok.f)).toEqual({ ok: true, refresh: "r", access: "a" });
    const body = new URLSearchParams(String(ok.calls[0].init?.body));
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("c0de");
    const noRefresh = fake([() => json({ access_token: "a" })]);
    expect(await exchangeCode("c", "https://x.in", noRefresh.f)).toEqual({ ok: false, error: "Google sent no refresh token" });
  });

  it("marks a revoked refresh token so the owner is told to connect again", async () => {
    const r = fake([() => json({ error: "invalid_grant", error_description: "Token has been expired or revoked." }, 400)]);
    expect(await accessToken("old", r.f)).toEqual({ ok: false, error: "Token has been expired or revoked.", revoked: true });
    const ok = fake([() => json({ access_token: "fresh" })]);
    expect(await accessToken("good", ok.f)).toEqual({ ok: true, token: "fresh" });
  });
});

describe("upload", () => {
  const meta = { title: "Fix your squat #shorts", description: "d", tags: ["squat"], privacy: "public" as const };

  it("starts a resumable session with the metadata, then sends the video bytes", async () => {
    const r = fake([() => json({}, 200, { location: "https://upload.test/session1" }), () => json({ id: "abc123", status: { privacyStatus: "public" } })]);
    expect(await uploadVideo("tok", Buffer.from("video"), meta, r.f)).toEqual({ ok: true, id: "abc123", privacy: "public", url: "https://youtube.com/shorts/abc123" });
    const start = r.calls[0];
    expect(start.url).toContain("uploadType=resumable");
    const h = start.init?.headers as Record<string, string>;
    expect(h.authorization).toBe("Bearer tok");
    expect(h["x-upload-content-length"]).toBe("5");
    const sent = JSON.parse(String(start.init?.body));
    expect(sent.snippet).toMatchObject({ title: meta.title, tags: ["squat"], categoryId: "17" });
    expect(sent.status).toMatchObject({ privacyStatus: "public", selfDeclaredMadeForKids: false });
    expect(r.calls[1]).toMatchObject({ url: "https://upload.test/session1", init: { method: "PUT" } });
  });

  it("reports YouTube's reason, and spots quota errors", async () => {
    const r = fake([() => json({ error: { message: "Quota exceeded", errors: [{ reason: "quotaExceeded" }] } }, 403)]);
    expect(await uploadVideo("tok", Buffer.from("v"), meta, r.f)).toEqual({ ok: false, error: "quotaExceeded: Quota exceeded", quota: true });
    const r2 = fake([() => json({}, 200, { location: "https://upload.test/s" }), () => json({ error: { message: "Bad video", errors: [{ reason: "invalidVideo" }] } }, 400)]);
    expect(await uploadVideo("tok", Buffer.from("v"), meta, r2.f)).toEqual({ ok: false, error: "invalidVideo: Bad video", quota: false });
  });
});
