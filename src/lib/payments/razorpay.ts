import "server-only";

// Razorpay, server side only. Keys come from Vercel environment variables:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  (Razorpay → Account & Settings → API Keys)
//   RAZORPAY_WEBHOOK_SECRET               (Razorpay → Webhooks, the secret you set there)
// The key id is public (Checkout needs it in the browser); the two secrets never leave the server.

export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

/** Creates an order for `amountPaise` (₹1 = 100 paise). Throws if Razorpay rejects it. */
export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  // RAZORPAY_API_URL exists only so end-to-end tests can point at a local stand-in.
  const res = await fetch(`${process.env.RAZORPAY_API_URL || "https://api.razorpay.com"}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: input.notes ?? {} }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as RazorpayOrder & { error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description || `Razorpay order failed (${res.status})`);
  return json;
}

export { verifyPaymentSignature, verifyWebhookSignature } from "./signature";
