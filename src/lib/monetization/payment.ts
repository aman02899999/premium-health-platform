// Payment abstraction — provider-agnostic, server-side verification required
// Do NOT claim payment success based only on frontend state

import { createHmac, timingSafeEqual } from "crypto";

export type PaymentProviderName = "razorpay" | "stripe" | "paypal" | "mock";

export interface PaymentOrderInput {
  productId: string;
  productType: "digital" | "report" | "plan" | "premium";
  amount: number; // in smallest currency unit or INR — we use INR paise handling in provider
  currency: "INR" | "USD";
  email?: string;
  attribution?: {
    page: string;
    source?: string;
    campaign?: string;
    cta?: string;
    utm?: Record<string, string>;
  };
}

export interface PaymentOrder {
  id: string; // internal order id
  providerOrderId?: string; // provider's order id
  amount: number;
  currency: string;
  status: "created" | "pending" | "paid" | "failed";
  checkoutUrl?: string;
  provider: PaymentProviderName;
  createdAt: string;
}

export interface PaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature?: string;
  provider: PaymentProviderName;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  paymentId: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  createOrder(input: PaymentOrderInput): Promise<PaymentOrder>;
  verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult>;
  getCheckoutUrl(order: PaymentOrder): string;
}

// Mock provider — for development, no real money
class MockPaymentProvider implements PaymentProvider {
  name: PaymentProviderName = "mock";

  async createOrder(input: PaymentOrderInput): Promise<PaymentOrder> {
    const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      providerOrderId: `mock_${id}`,
      amount: input.amount,
      currency: input.currency,
      status: "created",
      checkoutUrl: `/api/monetization/checkout/mock?orderId=${id}`,
      provider: "mock",
      createdAt: new Date().toISOString(),
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    // In mock, always verify if paymentId starts with mock_ or orderId exists
    // In production, this MUST be server-side verified via Razorpay/Stripe webhook signature
    if (!input.paymentId || !input.orderId) {
      return { verified: false, orderId: input.orderId, paymentId: input.paymentId, error: "Missing paymentId/orderId" };
    }
    return { verified: true, orderId: input.orderId, paymentId: input.paymentId, amount: 0, currency: "INR" };
  }

  getCheckoutUrl(order: PaymentOrder): string {
    return order.checkoutUrl || `/checkout?orderId=${order.id}`;
  }
}

// Razorpay provider — server-side only, uses env vars
// Env required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
class RazorpayProvider implements PaymentProvider {
  name: PaymentProviderName = "razorpay";

  async createOrder(input: PaymentOrderInput): Promise<PaymentOrder> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      // Fallback to mock if secrets missing — clearly indicate demo mode
      console.warn("[Payment] Razorpay secrets missing — using mock order");
      const mock = new MockPaymentProvider();
      return mock.createOrder(input);
    }
    // Real implementation would call Razorpay Orders API server-side
    // For now, create a mock order that would be replaced with real API call
    // Example real call:
    // const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    // const rpOrder = await razorpay.orders.create({ amount: input.amount*100, currency: input.currency, receipt: input.productId });
    const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      providerOrderId: `rzp_mock_${id}`,
      amount: input.amount,
      currency: input.currency,
      status: "created",
      checkoutUrl: `/api/monetization/checkout/razorpay?orderId=${id}`,
      provider: "razorpay",
      createdAt: new Date().toISOString(),
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret || !keySecret) {
      console.warn("[Payment] Razorpay webhook secret missing — using mock verification");
      return { verified: true, orderId: input.orderId, paymentId: input.paymentId, amount: 0, currency: "INR" };
    }
    // Real verification:
    // const crypto = require('crypto');
    // const expectedSignature = crypto.createHmac('sha256', keySecret).update(input.orderId + '|' + input.paymentId).digest('hex');
    // const verified = expectedSignature === input.signature;
    // For now mock verified
    if (!input.signature) {
      return { verified: false, orderId: input.orderId, paymentId: input.paymentId, error: "Missing signature" };
    }
    return { verified: true, orderId: input.orderId, paymentId: input.paymentId, amount: 0, currency: "INR" };
  }

  getCheckoutUrl(order: PaymentOrder): string {
    return order.checkoutUrl || `/checkout?orderId=${order.id}`;
  }
}

export function getPaymentProvider(name?: PaymentProviderName): PaymentProvider {
  const providerName = name || (process.env.PAYMENT_PROVIDER as PaymentProviderName) || "mock";
  switch (providerName) {
    case "razorpay":
      return new RazorpayProvider();
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

// Secure download token generation — expiring/signed URLs
//
// AUDIT FIX (defects #1 + #2): the previous implementation base64-encoded
// `orderId:productId:expiresAt:secret` and verified it by decoding the string
// and checking that the fields were PRESENT. Two consequences:
//   1. Anyone could mint a token for any product with any expiry — the embedded
//      secret was never validated, so paid digital products were downloadable
//      for free (forgeable token).
//   2. `expiresAt` was an ISO string containing colons, so `split(":")` truncated
//      the expiry to its hour segment → `new Date("2026-09-12T10")` → Invalid
//      Date → `Date.now() > NaN` is always false → tokens never expired.
//
// The token is now an HMAC-SHA256 signed payload with epoch-millisecond expiry:
//   payload   = `${orderId}|${productId}|${expiresAtMs}`      ("|" delimiter)
//   signature = HMAC-SHA256(payload, DOWNLOAD_TOKEN_SECRET)
//   token     = base64url(payload) + "." + base64url(signature)
// The signature is verified with timingSafeEqual BEFORE the payload is trusted.

const DOWNLOAD_TOKEN_TTL_HOURS = 72;

/** Signing key: dedicated secret, falling back to the NextAuth secret. */
function downloadTokenSecret(): string {
  return process.env.DOWNLOAD_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "demo-secret";
}

function signDownloadPayload(payload: string): string {
  return createHmac("sha256", downloadTokenSecret()).update(payload).digest("base64url");
}

export function generateDownloadToken(orderId: string, productId: string, expiresInHours = DOWNLOAD_TOKEN_TTL_HOURS): { token: string; expiresAt: string } {
  const expiresAtMs = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = `${orderId}|${productId}|${expiresAtMs}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${signDownloadPayload(payload)}`;
  return { token, expiresAt: new Date(expiresAtMs).toISOString() };
}

export function verifyDownloadToken(token: string): { valid: boolean; orderId?: string; productId?: string; expiresAt?: string; error?: string } {
  try {
    if (typeof token !== "string" || !token) {
      return { valid: false, error: "Invalid token" };
    }
    // Token = base64url(payload) "." base64url(hmac)
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid token format" };
    }
    const [encodedPayload, providedSignature] = parts;
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    if (!payload) {
      return { valid: false, error: "Invalid token format" };
    }

    // Verify the signature BEFORE trusting any part of the payload.
    const expected = Buffer.from(signDownloadPayload(payload), "base64url");
    const provided = Buffer.from(providedSignature, "base64url");
    if (expected.length === 0 || expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return { valid: false, error: "Invalid token signature" };
    }

    // Signature is valid — the payload is now trustworthy.
    const [orderId, productId, expiresAtMsRaw] = payload.split("|");
    if (!orderId || !productId || !expiresAtMsRaw) {
      return { valid: false, error: "Invalid token format" };
    }
    const expiresAtMs = Number(expiresAtMsRaw);
    if (!Number.isFinite(expiresAtMs)) {
      return { valid: false, error: "Invalid token format" };
    }
    const expiresAt = new Date(expiresAtMs).toISOString();
    if (Date.now() > expiresAtMs) {
      return { valid: false, error: "Token expired" };
    }
    return { valid: true, orderId, productId, expiresAt };
  } catch (e) {
    return { valid: false, error: "Invalid token" };
  }
}
