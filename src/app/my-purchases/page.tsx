import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { PremiumCTA } from "@/components/earning/PremiumCTA";
import Link from "next/link";

const seoTitle = "My Purchases — Downloads, Reports | BHG";
const seoDescription = "My purchases: digital products, diet plans, premium reports — download via secure expiring token /download/[token], 72h expiry, 3 download limit.";
const url = "/my-purchases";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent("My Purchases")}&category=${encodeURIComponent("Store")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function MyPurchasesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Store", href: "/store" }, { label: "My Purchases" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Store", item: "/store" }, { name: "My Purchases", item: "/my-purchases" }]}
        faqs={[
          { q: "How to download my purchase?", a: "After payment verified server-side, you get download token via /api/monetization/checkout/verify — token expiring 72h, limit 3. Use /download/[token] to get secure link. Private PDF URLs never public. Check /orders for order status." },
          { q: "What if download expired?", a: "Token expires after 72h or 3 downloads — request new token via support care@bharathealthguide.in with order ID. In production, admin can re-issue token via /admin/earning." },
        ]}
        howTo={{ name: "How to access purchases", steps: ["Complete purchase via /store/[slug]", "Verify payment via /api/monetization/checkout/verify — server-side", "Get download token + URL /download/[token] — expiring 72h", "Download PDF — private URL, secure, not public"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">My Purchases — Secure Delivery — Expiring Tokens</p>
        <h1 className="font-display mt-1 text-3xl font-black">My Purchases — Digital Guides, Diet Plans, Reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Access your digital products — diet plans, health guides, premium reports — via secure expiring token /download/[token]. 72h expiry, 3 download limit, private URLs never public, server-side verification.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Your Purchases — Demo Flow</h2>
            <p className="mt-1 text-xs text-stone-500">Demo flow — in production, list user's paid orders from DB with auth.</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                <p className="font-bold">1. Create Order</p>
                <p className="text-xs font-mono">POST /api/monetization/orders with productId, productType, email, page, utm</p>
                <p className="mt-1 text-xs">Returns order id + checkoutUrl — payment abstraction mock/razorpay</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                <p className="font-bold">2. Verify Payment (Server-Side)</p>
                <p className="text-xs font-mono">POST /api/monetization/checkout/verify with orderId, paymentId, signature</p>
                <p className="mt-1 text-xs">Verifies HMAC SHA256 server-side — never trust frontend alone. Returns downloadToken + downloadUrl /download/[token] + expiresAt 72h</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                <p className="font-bold">3. Download via Secure Token</p>
                <p className="text-xs font-mono">GET /api/monetization/download/[token] — verifies token, checks expiry, returns presigned URL or streams PDF</p>
                <p className="mt-1 text-xs">Private PDF URLs never public — expiring/signed URLs — download limit 3 — audit logging</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/store" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Browse Store →</Link>
              <Link href="/orders" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Orders →</Link>
              <Link href="/api/monetization/digital-products?limit=5" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Digital Products API</Link>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="My purchases footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
