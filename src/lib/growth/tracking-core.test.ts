import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BILLING_PROBE_SIZE, failureEffect, isBot, linkCode, outranks, parseResendEvent, parseStatuses, suppressesEmail, verifySvix, waBillingGate } from "./tracking-core";

const wa = (statuses: unknown[]) => ({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { statuses } }] }] });

describe("WhatsApp statuses", () => {
  it("reads delivered, read and failed with the error code and reason", () => {
    const s = parseStatuses(
      wa([
        { id: "wamid.1", status: "delivered", timestamp: "1792466000", recipient_id: "919876543210" },
        { id: "wamid.2", status: "failed", timestamp: "1792466001", recipient_id: "919811112222", errors: [{ code: 131026, title: "Message undeliverable", error_data: { details: "Message Undeliverable." } }] },
        { id: "wamid.3", status: "deleted", recipient_id: "91" },
      ]) as never,
    );
    expect(s).toHaveLength(2);
    expect(s[0]).toMatchObject({ id: "wamid.1", status: "delivered", recipient: "919876543210", code: null });
    expect(s[0].at.toISOString()).toBe("2026-10-20T03:13:20.000Z");
    expect(s[1]).toMatchObject({ status: "failed", code: "131026", reason: "Message Undeliverable." });
    expect(parseStatuses({ object: "instagram", entry: [] } as never)).toEqual([]);
  });

  it("only a stronger status replaces a weaker one", () => {
    expect(outranks("read", "delivered")).toBe(true);
    expect(outranks("delivered", "read")).toBe(false);
    expect(outranks("delivered", null)).toBe(true);
  });

  it("131026 marks the number unreachable, 131050 is an opt-out, frequency limits are neither", () => {
    expect(failureEffect("131026")).toBe("unreachable");
    expect(failureEffect("131050")).toBe("opted-out");
    expect(failureEffect("131049")).toBeNull();
    expect(failureEffect(null)).toBeNull();
  });
});

describe("Resend events", () => {
  it("maps event types and keeps the clicked link", () => {
    expect(parseResendEvent({ type: "email.clicked", created_at: "2026-10-20T05:00:00Z", data: { email_id: "em_1", click: { link: "https://x.in/r/abc" } } })).toMatchObject({ emailId: "em_1", type: "clicked", link: "https://x.in/r/abc" });
    expect(parseResendEvent({ type: "email.sent", data: { email_id: "em_1" } })).toBeNull();
    expect(parseResendEvent({ type: "email.opened", data: {} })).toBeNull();
  });

  it("keeps the bounce type, and suppresses only hard bounces and complaints", () => {
    const hard = parseResendEvent({ type: "email.bounced", data: { email_id: "em_2", bounce: { message: "Mailbox does not exist", type: "Permanent" } } });
    expect(hard).toMatchObject({ type: "bounced", bounceType: "Permanent" });
    expect(suppressesEmail(hard!)).toBe(true);
    expect(suppressesEmail({ type: "bounced", reason: "inbox was full", bounceType: "Transient" })).toBe(false);
    expect(suppressesEmail({ type: "bounced", reason: "general bounce", bounceType: "Undetermined" })).toBe(false);
    expect(suppressesEmail({ type: "complained", reason: null, bounceType: null })).toBe(true);
    expect(suppressesEmail({ type: "delivered", reason: null, bounceType: null })).toBe(false);
    // Events stored before the type was read: Resend's own wording decides.
    expect(suppressesEmail({ type: "bounced", reason: "The recipient's email provider sent a hard bounce message", bounceType: null })).toBe(true);
    expect(suppressesEmail({ type: "bounced", reason: "the recipient's inbox was full", bounceType: null })).toBe(false);
  });

  it("accepts a valid Svix signature and rejects a wrong or stale one", () => {
    const secret = `whsec_${Buffer.from("test-secret-key").toString("base64")}`;
    const body = '{"type":"email.delivered"}';
    const now = Date.parse("2026-10-20T05:00:00Z");
    const ts = String(now / 1000);
    const sig = createHmac("sha256", Buffer.from("test-secret-key")).update(`msg_1.${ts}.${body}`).digest("base64");
    expect(verifySvix(secret, "msg_1", ts, `v1,${sig}`, body, now)).toBe(true);
    expect(verifySvix(secret, "msg_1", ts, `v1,${sig}`, `${body} `, now)).toBe(false);
    expect(verifySvix(secret, "msg_1", ts, `v1,${sig}`, body, now + 10 * 60_000)).toBe(false);
    expect(verifySvix(secret, null, ts, `v1,${sig}`, body, now)).toBe(false);
  });
});

describe("tracked links", () => {
  it("one stable 9-character code per message", () => {
    const a = linkCode("campaign:c1:919876543210");
    expect(a).toMatch(/^[0-9A-Za-z]{9}$/);
    expect(linkCode("campaign:c1:919876543210")).toBe(a);
    expect(linkCode("campaign:c1:919876543211")).not.toBe(a);
  });

  it("link previews and scanners are not clicks", () => {
    expect(isBot("WhatsApp/2.24.1 A")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36")).toBe(false);
  });
});

describe("WhatsApp billing gate (Meta error 131042)", () => {
  const now = new Date("2026-10-24T02:30:00Z");
  const h = (hours: number) => new Date(now.getTime() - hours * 3600_000);

  it("stays open with no billing failure, or once a promotion is delivered after it", () => {
    expect(waBillingGate(null, null, now)).toEqual({ mode: "open", allow: Infinity });
    expect(waBillingGate(h(30), h(2), now).mode).toBe("open");
  });

  it("holds every promotion for a day after a billing failure", () => {
    expect(waBillingGate(h(1), null, now)).toEqual({ mode: "hold", allow: 0 });
    expect(waBillingGate(h(23), h(40), now).mode).toBe("hold");
  });

  it("then sends only a small probe per run until one gets through", () => {
    expect(waBillingGate(h(25), null, now)).toEqual({ mode: "probe", allow: BILLING_PROBE_SIZE });
    expect(waBillingGate(h(24 * 6), h(24 * 7), now).mode).toBe("probe");
  });
});
