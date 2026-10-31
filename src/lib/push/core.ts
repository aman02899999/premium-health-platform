// Web push (free app notifications): the checks that don't need the database or the network.
// A subscription's endpoint is a URL the server later posts to, so only the browsers' own push
// services are accepted; anything else could make the server call an address of the sender's choosing.

const PUSH_HOSTS = ["fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com", "push.services.mozilla.com", "web.push.apple.com"];
const PUSH_HOST_SUFFIXES = [".push.apple.com", ".notify.windows.com"];

export function isPushEndpoint(value: string): boolean {
  if (value.length > 1000) return false;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.port || u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  return PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s));
}

export type Subscription = { endpoint: string; p256dh: string; auth: string };

const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** The browser's PushSubscription.toJSON(), checked; a string is the reason it was refused. */
export function parseSubscription(input: unknown): Subscription | string {
  const b = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!b || typeof b.endpoint !== "string" || !isPushEndpoint(b.endpoint)) return "This browser's notification service isn't supported.";
  const { p256dh, auth } = b.keys ?? {};
  // p256dh is a 65-byte public key (87 characters), auth a 16-byte secret (22 characters).
  if (typeof p256dh !== "string" || !B64URL.test(p256dh) || p256dh.replace(/=+$/, "").length !== 87) return "Invalid notification key.";
  if (typeof auth !== "string" || !B64URL.test(auth) || auth.replace(/=+$/, "").length !== 22) return "Invalid notification key.";
  return { endpoint: b.endpoint, p256dh, auth };
}

/** A tap on a notification opens a page on this site only. */
export function sitePath(url: unknown): string {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//") || url.includes("\\")) return "/account";
  return url.slice(0, 300);
}

export type Notice = { title: string; body: string; url?: string; tag?: string };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** What the service worker shows (public/sw.js reads these four fields). */
export function notificationPayload(n: Notice): string {
  return JSON.stringify({
    title: clip(n.title.trim() || "Royal Fitness Club", 60),
    body: clip(n.body.trim(), 180),
    url: sitePath(n.url),
    tag: n.tag ? clip(n.tag, 40) : undefined,
  });
}

/** The push service says this subscription no longer exists (the member turned it off or reinstalled). */
export const isGone = (status: number | undefined) => status === 404 || status === 410;

// "Send me a test" throttle, per server instance: 3 per member per 10 minutes.
const TEST_WINDOW_MS = 10 * 60 * 1000;
const recentTests = new Map<string, number[]>();
export function allowTest(email: string, now = Date.now()): boolean {
  const times = (recentTests.get(email) ?? []).filter((t) => now - t < TEST_WINDOW_MS);
  if (times.length >= 3) return false;
  recentTests.set(email, [...times, now]);
  return true;
}
