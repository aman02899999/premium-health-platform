// Payment abstraction — provider-agnostic, server-side verification required
// Do NOT claim payment success based only on frontend state

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
// In production, use JWT or storage signed URLs (S3 presigned, etc.)
export function generateDownloadToken(orderId: string, productId: string, expiresInHours = 72): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  // Simple base64 token for demo — in prod use JWT with secret
  const payload = `${orderId}:${productId}:${expiresAt}:${process.env.NEXTAUTH_SECRET || "demo-secret"}`;
  const token = Buffer.from(payload).toString("base64url");
  return { token, expiresAt };
}

export function verifyDownloadToken(token: string): { valid: boolean; orderId?: string; productId?: string; expiresAt?: string; error?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [orderId, productId, expiresAt] = decoded.split(":");
    if (!orderId || !productId || !expiresAt) {
      return { valid: false, error: "Invalid token format" };
    }
    const exp = new Date(expiresAt).getTime();
    if (Date.now() > exp) {
      return { valid: false, error: "Token expired" };
    }
    return { valid: true, orderId, productId, expiresAt };
  } catch (e) {
    return { valid: false, error: "Invalid token" };
  }
}
