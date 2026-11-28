// Browser side of every checkout: after Razorpay says the payment succeeded, tell our server.
// Phones often drop the connection right after switching back from a UPI app, so a failed call is
// retried a few times. If it still can't get through, the payment is safe: the server checks
// Razorpay every 5 minutes and confirms it on its own, so the buyer must not pay twice.

export const UNREACHABLE_MESSAGE =
  "Your payment went through, but your connection dropped before we could confirm it. Please don't pay again: we'll confirm it automatically within 10 minutes and message you.";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;
export type ConfirmResult = { ok: boolean; status: number; data: Record<string, unknown> & { error?: string } };

export async function confirmPayment(
  url: string,
  body: unknown,
  { fetch: f = (u, i) => fetch(u, i), wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)), tries = 4 }: { fetch?: Fetch; wait?: (ms: number) => Promise<void>; tries?: number } = {},
): Promise<ConfirmResult> {
  for (let i = 0; i < tries; i++) {
    if (i > 0) await wait(1500 * i);
    try {
      const res = await f(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = ((await res.json().catch(() => ({}))) ?? {}) as ConfirmResult["data"];
      // 4xx is a real answer (bad signature, unknown order): retrying won't change it.
      if (res.ok || res.status < 500) return { ok: res.ok, status: res.status, data };
    } catch {
      // Connection dropped: try again.
    }
  }
  return { ok: false, status: 0, data: { error: UNREACHABLE_MESSAGE } };
}
