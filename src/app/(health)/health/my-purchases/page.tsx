import type { Metadata } from "next";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/health/components/ui";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";
import { SITE } from "@/health/lib/site";
import { PremiumCTA } from "@/health/components/earning/PremiumCTA";
import Link from "next/link";

const seoTitle = "My Purchases — Downloads, Reports | Premium Health";
const seoDescription = "Your health guides and diet plans: how to download your PDF, how long the link lasts, and how to get a new link.";
const url = "/health/my-purchases";
const absoluteUrl = `${SITE.url}${url}`;
const ogImage = `${SITE.url}/health/api/og?title=${encodeURIComponent("My Purchases")}&category=${encodeURIComponent("Store")}&type=tool`;

export const metadata: Metadata = {
  title: seoTitle.slice(0, 60),
  description: seoDescription.slice(0, 155),
  alternates: { canonical: url, languages: { "en-IN": absoluteUrl, "en": absoluteUrl, "x-default": absoluteUrl } },
  openGraph: { title: seoTitle, description: seoDescription, url: absoluteUrl, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }] },
};

export default function MyPurchasesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Store", href: "/health/store" }, { label: "My Purchases" }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/health" }, { name: "Store", item: "/health/store" }, { name: "My Purchases", item: "/health/my-purchases" }]}
        faqs={[
          { q: "How do I download my purchase?", a: "Use the download link shown after payment. Each link works for 72 hours and up to 3 downloads." },
          { q: "What if my download link expired?", a: "Contact us through the contact page with your order ID, and we'll send you a new link." },
        ]}
        howTo={{ name: "How to access your purchases", steps: ["Buy a guide in the store", "Open the download link shown after payment", "Save the PDF to your device", "Need a new link? Contact us with your order ID"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-800 to-emerald-800 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">My purchases</p>
        <h1 className="font-display mt-1 text-3xl font-black">Your guides and diet plans</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-100/90">Everything you buy is a PDF you keep. Download it from the link shown after payment.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">Getting your PDF</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Pay securely with Razorpay (UPI, card or net banking).</li>
              <li>Your download link opens straight away.</li>
              <li>Download within 72 hours. Each link works up to 3 times, so save the file once it&apos;s downloaded.</li>
            </ol>
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">Lost the link or it expired? Contact us with your order ID and we&apos;ll send a new one.</p>
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

      <div className="mt-8 space-y-4"><AdSlot slot="My purchases footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
