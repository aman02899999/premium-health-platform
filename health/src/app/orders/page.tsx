import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import Link from "next/link";

const seoTitle = "Orders — Digital Product Orders | BHG";
const seoDescription = "View orders: order ID, product, amount, payment status, date — secure delivery, server-side verification, no sensitive payment credentials displayed.";
const url = "/orders";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("Orders — Digital Products")}&category=${encodeURIComponent("Store")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Store", href: "/store" }, { label: "Orders" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Store", item: "/store" }, { name: "Orders", item: "/orders" }]}
        faqs={[
          { q: "How orders work?", a: "After payment verified server-side via /api/monetization/checkout/verify, order status paid, download token generated expiring 72h, limit 3. View in /orders + /my-purchases. Never display sensitive payment credentials." },
          { q: "Where is my download?", a: "After successful payment, go to /my-purchases or /download/[token] — token expiring, secure, private PDF URLs never public. Check /api/monetization/orders?limit=20 for order status." },
        ]}
        howTo={{ name: "How to view orders", steps: ["Complete purchase via /store/[slug] + checkout", "Verify payment server-side via /api/monetization/checkout/verify", "View orders in /orders + /my-purchases", "Download via /download/[token] — expiring 72h"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Orders — Secure Delivery — Server-Side Verification</p>
        <h1 className="font-display mt-1 text-3xl font-black">Orders — Digital Product Orders — Secure</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">View order ID, product, amount, payment status, date — secure delivery, server-side verification, expiring tokens, no sensitive payment credentials displayed. Privacy-conscious.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Your Orders — Demo</h2>
            <p className="mt-1 text-xs text-stone-500">In production, fetch from /api/monetization/orders?limit=20 with user auth. Demo shows API usage.</p>
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-xs font-mono dark:bg-stone-800">
              <p>GET /api/monetization/orders?limit=20</p>
              <p className="mt-2">Returns: id, productId, productTitle, amount, currency, status pending/paid/failed/refunded/expired, paymentProvider, checkoutUrl, createdAt</p>
              <p className="mt-2">Never display sensitive payment credentials — only order ID, product, amount, status, date.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/api/monetization/orders?limit=20" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">View Orders API</Link>
              <Link href="/my-purchases" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">My Purchases →</Link>
              <Link href="/store" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Store →</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Payment Architecture — Abstraction</h2>
            <p className="mt-1 text-xs text-stone-500">PaymentProvider abstraction with support for payment URL, checkout, verification, order creation, refund status. Initially mock + Razorpay. Server-side verification required.</p>
            <ul className="mt-3 list-disc pl-5 text-xs text-stone-600 dark:text-stone-300">
              <li>Mock provider for dev — no real money — order creation + verification mocked</li>
              <li>Razorpay provider — uses RAZORPAY_KEY_ID, SECRET, WEBHOOK_SECRET — server-side only, never frontend</li>
              <li>Verification: POST /api/monetization/checkout/verify with orderId, paymentId, signature — verifies HMAC SHA256 server-side</li>
              <li>Never claim payment success based only on frontend state — server verification mandatory</li>
              <li>Env vars: PAYMENT_PROVIDER, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, NEXTAUTH_SECRET</li>
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Orders footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
