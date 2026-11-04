import { describe, expect, it } from "vitest";
import { allowTest, isGone, isPushEndpoint, notificationPayload, parseSubscription, sitePath } from "./core";

const P256 = "B" + "A".repeat(86); // 87 base64url characters = a 65-byte public key
const AUTH = "A".repeat(22); // 22 characters = a 16-byte secret
const sub = (endpoint: string, keys: Record<string, unknown> = { p256dh: P256, auth: AUTH }) => ({ endpoint, keys });

describe("push endpoints", () => {
  it("accepts the browser push services only", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc:def")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/QAbc")).toBe(true);
    expect(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc")).toBe(true);
  });

  it("refuses anything that would make the server call some other address", () => {
    expect(isPushEndpoint("http://fcm.googleapis.com/fcm/send/abc")).toBe(false);
    expect(isPushEndpoint("https://fcm.googleapis.com.evil.in/fcm/send/abc")).toBe(false);
    expect(isPushEndpoint("https://evilpush.apple.com.example/x")).toBe(false);
    expect(isPushEndpoint("https://localhost/x")).toBe(false);
    expect(isPushEndpoint("https://169.254.169.254/latest")).toBe(false);
    expect(isPushEndpoint("https://user:pw@fcm.googleapis.com/fcm/send/abc")).toBe(false);
    expect(isPushEndpoint("https://fcm.googleapis.com:8443/fcm/send/abc")).toBe(false);
    expect(isPushEndpoint("not a url")).toBe(false);
    expect(isPushEndpoint(`https://fcm.googleapis.com/${"a".repeat(1100)}`)).toBe(false);
  });
});

describe("parseSubscription", () => {
  it("keeps the endpoint and the two keys", () => {
    expect(parseSubscription(sub("https://fcm.googleapis.com/fcm/send/abc"))).toEqual({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: P256, auth: AUTH });
  });

  it("refuses bad endpoints and keys", () => {
    expect(typeof parseSubscription(null)).toBe("string");
    expect(typeof parseSubscription(sub("https://example.com/push"))).toBe("string");
    expect(typeof parseSubscription(sub("https://fcm.googleapis.com/fcm/send/abc", { p256dh: "short", auth: AUTH }))).toBe("string");
    expect(typeof parseSubscription(sub("https://fcm.googleapis.com/fcm/send/abc", { p256dh: P256, auth: "bad+chars/==" }))).toBe("string");
    expect(typeof parseSubscription(sub("https://fcm.googleapis.com/fcm/send/abc", {}))).toBe("string");
  });
});

describe("notifications", () => {
  it("only opens pages on this site", () => {
    expect(sitePath("/account/plans")).toBe("/account/plans");
    expect(sitePath("/join?ref=RFC-A-1")).toBe("/join?ref=RFC-A-1");
    expect(sitePath("//evil.in/x")).toBe("/account");
    expect(sitePath("/\\evil.in")).toBe("/account");
    expect(sitePath("https://evil.in")).toBe("/account");
    expect(sitePath("javascript:alert(1)")).toBe("/account");
    expect(sitePath(undefined)).toBe("/account");
  });

  it("keeps the message short and plain", () => {
    const p = JSON.parse(notificationPayload({ title: "  Hi  ", body: "x".repeat(500), url: "/account", tag: "renewal" }));
    expect(p).toMatchObject({ title: "Hi", url: "/account", tag: "renewal" });
    expect(p.body.length).toBeLessThanOrEqual(180);
    expect(JSON.parse(notificationPayload({ title: "", body: "b" })).title).toBe("Royal Fitness Club");
  });

  it("treats 404 and 410 as a phone that turned notifications off", () => {
    expect(isGone(410)).toBe(true);
    expect(isGone(404)).toBe(true);
    expect(isGone(429)).toBe(false);
    expect(isGone(undefined)).toBe(false);
  });
});

describe("test sends", () => {
  it("allows 3 per member per 10 minutes", () => {
    const t = 1_000_000;
    expect([1, 2, 3, 4].map((i) => allowTest("a@x.in", t + i))).toEqual([true, true, true, false]);
    expect(allowTest("b@x.in", t)).toBe(true);
    expect(allowTest("a@x.in", t + 10 * 60 * 1000 + 5)).toBe(true);
  });
});
