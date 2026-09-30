import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import Link from "next/link";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Download — Secure Token | BHG",
  description: "Secure download via expiring token — 72h expiry, 3 download limit, private PDF URLs never public, server-side verification.",
  robots: { index: false, follow: false },
};

export default async function DownloadTokenPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Store", href: "/store" }, { label: "Download" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Store", item: "/store" }, { name: "Download", item: `/download/${token}` }]}
        faqs={[
          { q: "How secure download works?", a: "Token is an HMAC-SHA256 signed payload (orderId|productId|expiry-epoch-ms) — the signature is verified with a timing-safe comparison server-side via /api/monetization/download/[token] before any field is trusted. Expires 72h, limit 3. Private PDF URLs never public — use presigned S3/R2 URLs in production." },
          { q: "What if token expired?", a: "Expired token returns 400 error — request new token via support with order ID. Admin can re-issue via /admin/earning." },
        ]}
        howTo={{ name: "How to download", steps: ["Get token from /api/monetization/checkout/verify after payment verified", "Visit /download/[token] — server verifies expiry", "Call /api/monetization/download/[token] — returns presigned URL or streams PDF", "Download — Content-Disposition attachment — audit logging"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-emerald-900 to-stone-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Secure Download — Expiring Token — 72h — 3 Downloads</p>
        <h1 className="font-display mt-1 text-3xl font-black">Download — Secure Token Verification</h1>
        <p className="mt-2 text-sm text-emerald-100/90">Token: {token.slice(0, 20)}… — verifying server-side. Private PDF URLs never public. Expiring/signed URLs. Payment verified server-side.</p>
      </div>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="font-bold">Download Verification — Demo</h2>
        <p className="mt-1 text-xs text-stone-500">In production, this page would call /api/monetization/download/[token] and stream file or redirect to presigned URL.</p>
        <div className="mt-4 rounded-xl bg-stone-50 p-4 text-xs font-mono dark:bg-stone-800">
          <p>Token: {token}</p>
          <p className="mt-2">Verification: verifyDownloadToken() — HMAC-SHA256 signature check (timingSafeEqual) → decode orderId, productId, expiry → expiry check in epoch ms</p>
          <p className="mt-2">Security: server-side verification, expiring 72h, download limit 3, audit logging, secure file access, no public PDF URLs</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/api/monetization/download/${token}`} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Verify via API →</a>
          <Link href="/my-purchases" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">My Purchases →</Link>
          <Link href="/orders" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Orders →</Link>
        </div>
        <p className="mt-4 text-[11px] text-stone-400">Do NOT expose private PDF file URLs publicly. Use expiring/signed download URLs. Payment confirmation must be server-side verified. Never store raw card info.</p>
      </div>

      <div className="mt-8 space-y-4"><AdSlot slot="Download footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
