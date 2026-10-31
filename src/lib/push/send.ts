import "server-only";
import webpush from "web-push";
import { SITE_URL } from "@/lib/site";
import { isGone, notificationPayload, type Notice } from "./core";
import { activeFor, recordResult } from "./store";

// Sending is free: the browser's own push service (Google, Apple, Mozilla, Microsoft) delivers it.
// The two VAPID keys prove the messages come from this site. Make them once with
// `npx web-push generate-vapid-keys` and set both in Vercel; without them nothing is offered or sent.

const publicKey = () => process.env.VAPID_PUBLIC_KEY?.trim() || "";
const privateKey = () => process.env.VAPID_PRIVATE_KEY?.trim() || "";

export const pushConfigured = () => Boolean(publicKey() && privateKey());

/** The key the browser needs to subscribe (public by design). */
export const vapidPublicKey = () => (pushConfigured() ? publicKey() : null);

export type PushOutcome = { sent: number; gone: number; failed: number };

/** Sends one notification to every browser the member switched on. */
export async function pushToMember(email: string, notice: Notice): Promise<PushOutcome> {
  const out: PushOutcome = { sent: 0, gone: 0, failed: 0 };
  if (!pushConfigured()) return out;
  const payload = notificationPayload(notice);
  // The subject is a contact for the push services: the site's address, never a personal email.
  const vapidDetails = { subject: SITE_URL, publicKey: publicKey(), privateKey: privateKey() };
  for (const s of await activeFor(email)) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { vapidDetails, TTL: 24 * 60 * 60, urgency: "normal", timeout: 10_000 });
      out.sent += 1;
      await recordResult(s.id, "sent");
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (isGone(status)) {
        out.gone += 1;
        await recordResult(s.id, "gone");
      } else {
        out.failed += 1;
        await recordResult(s.id, { error: `${status ?? "network"}: ${(err as Error).message}` });
      }
    }
  }
  return out;
}
