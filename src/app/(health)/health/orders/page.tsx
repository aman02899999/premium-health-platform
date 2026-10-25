import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import Link from "next/link";

const seoTitle = "Orders — Digital Product Orders";
const seoDescription = "Help with your digital guide orders: where your download link is, how long it lasts, and what to do if it has expired.";
const url = "/health/orders";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("Orders — Digital Products")}&category=${encodeURIComponent("Store")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Store", href: "/health/store" }, { label: "Orders" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Store", item: "/health/store" }, { name: "Orders", item: "/health/orders" }]}
        faqs={[
          { q: "Where is my order?", a: "As soon as your payment is confirmed, your download link opens on screen. The link works for 72 hours and up to 3 downloads." },
          { q: "My link expired or I lost it — what now?", a: "Write to us through the contact page with your order ID, and we'll send a fresh link." },
        ]}
        howTo={{ name: "How to get your guide after buying", steps: ["Choose a guide in the store and pay securely with Razorpay", "Your download link opens right away", "Download the PDF within 72 hours (up to 3 times)", "Lost the link? Contact us with your order ID"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Orders &amp; downloads</p>
        <h1 className="font-display mt-1 text-3xl font-black">Your orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">Bought a guide or diet plan? Here&apos;s how to get to it — and what to do if the link has expired.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">How delivery works</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Payments are handled by Razorpay. We never see or store your card or UPI details.</li>
              <li>Once the payment is confirmed, your download link opens on screen.</li>
              <li>Each link works for 72 hours and up to 3 downloads, so keep the PDF on your phone or computer.</li>
              <li>Link expired or lost? Contact us with your order ID and we&apos;ll resend it.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/health/store" className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Browse the store →</Link>
              <Link href="/health/contact" className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Contact us</Link>
            </div>
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
